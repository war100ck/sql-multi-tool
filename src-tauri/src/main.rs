#![windows_subsystem = "windows"]

use serde::{Deserialize, Serialize};
use tiberius::{Client, Config, AuthMethod, QueryItem};
use tokio_util::compat::TokioAsyncWriteCompatExt;
use futures_util::TryStreamExt;
use anyhow::Result;
use chrono::Local;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DbConfig {
    server: String,
    user: String,
    password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DatabaseInfo {
    name: String,
    size_mb: f64,
    status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct BackupFileInfo {
    logical_name: String,
    physical_name: String,
    file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RestoreResult {
    success: bool,
    message: String,
    logs: Vec<String>,
}

async fn get_client(config: &DbConfig) -> Result<Client<tokio_util::compat::Compat<tokio::net::TcpStream>>> {
    let mut tconfig = Config::new();
    tconfig.host(config.server.clone());
    tconfig.port(1433);
    tconfig.authentication(AuthMethod::sql_server(config.user.clone(), config.password.clone()));
    tconfig.trust_cert();

    let tcp = tokio::net::TcpStream::connect(format!("{}:1433", config.server)).await?;
    tcp.set_nodelay(true)?;

    let client = Client::connect(tconfig, tcp.compat_write()).await?;
    Ok(client)
}

#[tauri::command]
async fn test_connection(config: DbConfig) -> Result<bool, String> {
    match get_client(&config).await {
        Ok(mut client) => {
            let mut stream = client.query("SELECT 1", &[]).await.map_err(|e| e.to_string())?;
            let _ = stream.try_next().await;
            Ok(true)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_databases(config: DbConfig) -> Result<Vec<DatabaseInfo>, String> {
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    let query = r#"
        SELECT 
            d.name,
            CAST(SUM(mf.size) * 8.0 / 1024 AS FLOAT) as SizeMB,
            CASE WHEN d.state = 0 THEN 'Online' ELSE 'Offline' END as Status
        FROM sys.databases d
        INNER JOIN sys.master_files mf ON d.database_id = mf.database_id
        WHERE d.name NOT IN ('master','tempdb','model','msdb')
        GROUP BY d.name, d.state
        ORDER BY d.name
    "#;

    let mut stream = client.query(query, &[]).await.map_err(|e| e.to_string())?;
    let mut databases = Vec::new();

    while let Some(item) = stream.try_next().await.map_err(|e| e.to_string())? {
        if let QueryItem::Row(row) = item {
            let name = row.get::<&str, _>("name").unwrap_or("").to_string();
            let size_mb = row.get::<f64, _>("SizeMB").unwrap_or(0.0);
            let status = row.get::<&str, _>("Status").unwrap_or("Unknown").to_string();
            databases.push(DatabaseInfo { name, size_mb, status });
        }
    }

    Ok(databases)
}

#[tauri::command]
async fn get_database_folders(config: DbConfig) -> Result<Vec<String>, String> {
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    let query = r#"
        SELECT DISTINCT LEFT(physical_name, LEN(physical_name) - CHARINDEX('\', REVERSE(physical_name)))
        FROM sys.master_files
        WHERE database_id > 4
    "#;

    let mut stream = client.query(query, &[]).await.map_err(|e| e.to_string())?;
    let mut folders = Vec::new();

    while let Some(item) = stream.try_next().await.map_err(|e| e.to_string())? {
        if let QueryItem::Row(row) = item {
            if let Some(path) = row.get::<&str, _>(0) {
                folders.push(path.to_string());
            }
        }
    }

    folders.sort();
    folders.dedup();
    Ok(folders)
}

#[tauri::command]
async fn get_backup_info(config: DbConfig, bak_file: String) -> Result<Vec<BackupFileInfo>, String> {
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    let query = format!("RESTORE FILELISTONLY FROM DISK = '{}'", bak_file.replace("'", "''"));
    let mut stream = client.query(&query, &[]).await.map_err(|e| e.to_string())?;
    let mut files = Vec::new();

    while let Some(item) = stream.try_next().await.map_err(|e| e.to_string())? {
        if let QueryItem::Row(row) = item {
            files.push(BackupFileInfo {
                logical_name: row.get::<&str, _>("LogicalName").unwrap_or("").to_string(),
                physical_name: row.get::<&str, _>("PhysicalName").unwrap_or("").to_string(),
                file_type: row.get::<&str, _>("Type").unwrap_or("D").to_string(),
            });
        }
    }

    Ok(files)
}

#[tauri::command]
async fn restore_database(config: DbConfig, db_name: String, bak_file: String, folder: String) -> Result<RestoreResult, String> {
    let mut logs = Vec::new();
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    logs.push(format!("[{}] Получение информации о файлах бэкапа...", Local::now().format("%H:%M:%S")));

    let backup_files = {
        let query = format!("RESTORE FILELISTONLY FROM DISK = '{}'", bak_file.replace("'", "''"));
        let mut stream = client.query(&query, &[]).await.map_err(|e| e.to_string())?;
        let mut files = Vec::new();

        while let Some(item) = stream.try_next().await.map_err(|e| e.to_string())? {
            if let QueryItem::Row(row) = item {
                files.push((
                    row.get::<&str, _>("LogicalName").unwrap_or("").to_string(),
                    row.get::<&str, _>("Type").unwrap_or("D").to_string(),
                ));
            }
        }
        files
    };

    let mut move_commands = Vec::new();
    for (logical_name, file_type) in backup_files {
        let ext = if file_type == "D" { ".mdf" } else { ".ldf" };
        let physical_path = format!("{}\\{}{}", folder, logical_name, ext);
        move_commands.push(format!("MOVE '{}' TO '{}'", logical_name.replace("'", "''"), physical_path.replace("'", "''")));
        logs.push(format!("[{}] {} -> {}", Local::now().format("%H:%M:%S"), logical_name, physical_path));
    }

    logs.push(format!("[{}] Завершение активных сессий...", Local::now().format("%H:%M:%S")));

    let alter_cmd = format!(
        "IF DB_ID('{}') IS NOT NULL ALTER DATABASE [{}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE",
        db_name.replace("'", "''"), db_name
    );
    let _ = client.execute(&alter_cmd, &[]).await;

    let move_clause = move_commands.join(", ");
    let restore_cmd = format!(
        "RESTORE DATABASE [{}] FROM DISK='{}' WITH {}, REPLACE, STATS=10",
        db_name, bak_file.replace("'", "''"), move_clause
    );

    logs.push(format!("[{}] Выполняется восстановление базы...", Local::now().format("%H:%M:%S")));

    let result = client.execute(&restore_cmd, &[]).await;

    match result {
        Ok(_) => {
            let multi_cmd = format!("ALTER DATABASE [{}] SET MULTI_USER", db_name);
            let _ = client.execute(&multi_cmd, &[]).await;

            logs.push(format!("[{}] [OK] База {} восстановлена успешно.", Local::now().format("%H:%M:%S"), db_name));
            Ok(RestoreResult {
                success: true,
                message: format!("База {} восстановлена успешно!", db_name),
                logs,
            })
        }
        Err(e) => {
            logs.push(format!("[{}] [ERROR] Ошибка восстановления: {}", Local::now().format("%H:%M:%S"), e));
            Ok(RestoreResult {
                success: false,
                message: format!("Не удалось восстановить базу {}: {}", db_name, e),
                logs,
            })
        }
    }
}

#[tauri::command]
async fn create_backup(config: DbConfig, db_name: String, backup_path: String) -> Result<RestoreResult, String> {
    let mut logs = Vec::new();
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    let query = format!(
        "BACKUP DATABASE [{}] TO DISK = '{}' WITH FORMAT, STATS = 5",
        db_name, backup_path.replace("'", "''")
    );

    logs.push(format!("[{}] Создание бэкапа {}...", Local::now().format("%H:%M:%S"), db_name));

    match client.execute(&query, &[]).await {
        Ok(_) => {
            logs.push(format!("[{}] [OK] Бэкап {} создан: {}", Local::now().format("%H:%M:%S"), db_name, backup_path));
            Ok(RestoreResult {
                success: true,
                message: format!("Бэкап {} создан успешно!", db_name),
                logs,
            })
        }
        Err(e) => {
            logs.push(format!("[{}] [ERROR] Ошибка создания бэкапа: {}", Local::now().format("%H:%M:%S"), e));
            Ok(RestoreResult {
                success: false,
                message: format!("Ошибка при создании бэкапа {}: {}", db_name, e),
                logs,
            })
        }
    }
}

#[tauri::command]
async fn delete_database(config: DbConfig, db_name: String) -> Result<RestoreResult, String> {
    let mut logs = Vec::new();
    let mut client = get_client(&config).await.map_err(|e| e.to_string())?;

    let alter_cmd = format!(
        "ALTER DATABASE [{}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{}]",
        db_name, db_name
    );

    logs.push(format!("[{}] Удаление базы {}...", Local::now().format("%H:%M:%S"), db_name));

    match client.execute(&alter_cmd, &[]).await {
        Ok(_) => {
            logs.push(format!("[{}] [OK] База {} удалена.", Local::now().format("%H:%M:%S"), db_name));
            Ok(RestoreResult {
                success: true,
                message: format!("База {} удалена успешно!", db_name),
                logs,
            })
        }
        Err(e) => {
            logs.push(format!("[{}] [ERROR] Ошибка удаления: {}", Local::now().format("%H:%M:%S"), e));
            Ok(RestoreResult {
                success: false,
                message: format!("Не удалось удалить базу {}: {}", db_name, e),
                logs,
            })
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            test_connection,
            get_databases,
            get_database_folders,
            get_backup_info,
            restore_database,
            create_backup,
            delete_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
