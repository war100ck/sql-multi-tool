// ===== SQL Multi Tool - Frontend =====
const { invoke } = window.__TAURI__;
const { dialog, path, window: tauriWindow } = window.__TAURI__;

// ===== i18n =====
const i18n = {
    ru: {
        appTitle: 'SQL Multi Tool', notConnected: 'Не подключено', connected: 'Подключено',
        tabRestore: 'Восстановление', tabManage: 'Управление', tabSettings: 'Настройки',
        restoreTitle: 'Восстановление базы данных', backupFileLabel: 'Файл резервной копии (.bak)',
        folderLabel: 'Папка для восстановления', browse: 'Обзор...', restoreBtn: 'Восстановить базу',
        clear: 'Очистить', logTitle: 'Журнал операций', manageTitle: 'Управление базами данных',
        refresh: 'Обновить', backupSelected: 'Бэкап выбранных', deleteSelected: 'Удалить выбранные',
        dbName: 'Название базы', dbSize: 'Размер', dbStatus: 'Статус',
        clickRefresh: 'Нажмите "Обновить" для загрузки данных', databases: 'баз данных',
        settingsTitle: 'Настройки подключения', sqlServer: 'SQL Server', login: 'Логин',
        password: 'Пароль', backupFormatLabel: 'Формат имени бэкапа',
        formatDated: 'ИмяБД_20260714_145541.bak', formatSimple: 'ИмяБД.bak',
        formatDatedModal: 'С датой: ИмяБД_20260714_145541.bak', formatSimpleModal: 'Простой: ИмяБД.bak',
        test: 'Тестировать', save: 'Сохранить', ready: 'Готов к работе',
        confirmDelete: 'Подтвердите удаление', deleteConfirmText: 'Вы действительно хотите удалить выбранные базы?',
        deleteWarning: 'Это действие невозможно отменить!', cancel: 'Отмена', delete: 'Удалить',
        createBackup: 'Создание бэкапа', backupFolderLabel: 'Папка для сохранения',
        selectedDbs: 'Выбранные базы', create: 'Создать', loadingFolders: 'Загрузка папок...',
        noConnection: 'Нет подключения', foldersNotFound: 'Папки не найдены', loadError: 'Ошибка загрузки',
        dbNotFound: 'Базы данных не найдены', connError: 'Ошибка подключения',
        backupComplete: 'Бэкап завершен', deleteComplete: 'Удаление завершено',
        restoreComplete: 'Восстановление завершено', success: 'Успешно', error: 'Ошибка',
        connectionTest: 'Проверка подключения', connectionOk: 'Соединение с SQL Server установлено',
        connectionFail: 'Не удалось подключиться к SQL Server', settingsSaved: 'Настройки сохранены',
        enterServer: 'Укажите сервер', massRestoreTitle: 'Массовое восстановление',
        selectFiles: 'Выберите файлы .bak', filesSelected: 'файлов выбрано',
        restoreAll: 'Восстановить все', restoreProgress: 'Восстановление', of: 'из',
    },
    en: {
        appTitle: 'SQL Multi Tool', notConnected: 'Not connected', connected: 'Connected',
        tabRestore: 'Restore', tabManage: 'Manage', tabSettings: 'Settings',
        restoreTitle: 'Database Restore', backupFileLabel: 'Backup file (.bak)',
        folderLabel: 'Restore folder', browse: 'Browse...', restoreBtn: 'Restore Database',
        clear: 'Clear', logTitle: 'Operation Log', manageTitle: 'Database Management',
        refresh: 'Refresh', backupSelected: 'Backup Selected', deleteSelected: 'Delete Selected',
        dbName: 'Database Name', dbSize: 'Size', dbStatus: 'Status',
        clickRefresh: 'Click "Refresh" to load data', databases: 'databases',
        settingsTitle: 'Connection Settings', sqlServer: 'SQL Server', login: 'Login',
        password: 'Password', backupFormatLabel: 'Backup filename format',
        formatDated: 'DBName_20260714_145541.bak', formatSimple: 'DBName.bak',
        formatDatedModal: 'With date: DBName_20260714_145541.bak', formatSimpleModal: 'Simple: DBName.bak',
        test: 'Test', save: 'Save', ready: 'Ready',
        confirmDelete: 'Confirm Deletion', deleteConfirmText: 'Are you sure you want to delete selected databases?',
        deleteWarning: 'This action cannot be undone!', cancel: 'Cancel', delete: 'Delete',
        createBackup: 'Create Backup', backupFolderLabel: 'Save folder',
        selectedDbs: 'Selected databases', create: 'Create', loadingFolders: 'Loading folders...',
        noConnection: 'No connection', foldersNotFound: 'Folders not found', loadError: 'Load error',
        dbNotFound: 'No databases found', connError: 'Connection error',
        backupComplete: 'Backup complete', deleteComplete: 'Deletion complete',
        restoreComplete: 'Restore complete', success: 'Success', error: 'Error',
        connectionTest: 'Testing connection', connectionOk: 'SQL Server connection established',
        connectionFail: 'Failed to connect to SQL Server', settingsSaved: 'Settings saved',
        enterServer: 'Enter server address', massRestoreTitle: 'Mass Restore',
        selectFiles: 'Select .bak files', filesSelected: 'files selected',
        restoreAll: 'Restore All', restoreProgress: 'Restoring', of: 'of',
    }
};

let currentLang = localStorage.getItem('sql_lang') || 'ru';

function t(key) {
    return i18n[currentLang][key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sql_lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (i18n[lang][key]) el.textContent = i18n[lang][key];
    });
}

// ===== State =====
let config = { server: 'localhost', user: '', password: '' };
let selectedDbs = [];
let bakFiles = [];
let selectedFolder = '';
let dbFolders = [];
let isConnected = false;

// ===== DOM Elements =====
const els = {};

function cacheElements() {
    els.connDot = document.getElementById('connDot');
    els.connText = document.getElementById('connText');
    els.btnMinimize = document.getElementById('btnMinimize');
    els.btnMaximize = document.getElementById('btnMaximize');
    els.btnClose = document.getElementById('btnClose');
    els.navItems = document.querySelectorAll('.nav-item');
    els.tabPanels = document.querySelectorAll('.tab-panel');
    els.bakPath = document.getElementById('bakPath');
    els.btnBrowseBak = document.getElementById('btnBrowseBak');
    els.folderSelect = document.getElementById('folderSelect');
    els.btnRestore = document.getElementById('btnRestore');
    els.btnClearRestore = document.getElementById('btnClearRestore');
    els.restoreProgressArea = document.getElementById('restoreProgressArea');
    els.restoreProgress = document.getElementById('restoreProgress');
    els.restoreProgressText = document.getElementById('restoreProgressText');
    els.restoreLog = document.getElementById('restoreLog');
    els.btnClearLogs = document.getElementById('btnClearLogs');
    els.dbTableBody = document.getElementById('dbTableBody');
    els.btnRefreshDB = document.getElementById('btnRefreshDB');
    els.btnBackupDB = document.getElementById('btnBackupDB');
    els.btnDeleteDB = document.getElementById('btnDeleteDB');
    els.dbStatus = document.getElementById('dbStatus');
    els.selectAll = document.getElementById('selectAll');
    els.settingServer = document.getElementById('settingServer');
    els.settingUser = document.getElementById('settingUser');
    els.settingPass = document.getElementById('settingPass');
    els.btnTestConn = document.getElementById('btnTestConn');
    els.btnSaveSettings = document.getElementById('btnSaveSettings');
    els.statusText = document.getElementById('statusText');
    els.deleteModal = document.getElementById('deleteModal');
    els.deleteDbList = document.getElementById('deleteDbList');
    els.btnCancelDelete = document.getElementById('btnCancelDelete');
    els.btnConfirmDelete = document.getElementById('btnConfirmDelete');
    els.backupModal = document.getElementById('backupModal');
    els.backupPathInput = document.getElementById('backupPathInput');
    els.backupDbList = document.getElementById('backupDbList');
    els.btnBrowseBackup = document.getElementById('btnBrowseBackup');
    els.btnCancelBackup = document.getElementById('btnCancelBackup');
    els.btnConfirmBackup = document.getElementById('btnConfirmBackup');
}

// ===== Toast =====
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconSvg = type === 'success' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : type === 'error'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    toast.innerHTML = `<div class="toast-icon">${iconSvg}</div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close">&times;</button>`;
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300); }, 4000);
}

function setStatus(msg) { els.statusText.textContent = msg; }

function logRestore(msg, type = 'info') {
    const span = document.createElement('div');
    span.className = `log-${type}`;
    span.textContent = msg;
    els.restoreLog.appendChild(span);
    els.restoreLog.scrollTop = els.restoreLog.scrollHeight;
}

function clearRestoreLogs() { els.restoreLog.innerHTML = ''; }

function setConnectionStatus(connected) {
    isConnected = connected;
    if (connected) {
        els.connDot.classList.add('connected');
        els.connText.textContent = t('connected');
        setStatus(t('connected'));
    } else {
        els.connDot.classList.remove('connected');
        els.connText.textContent = t('notConnected');
        setStatus(t('notConnected'));
    }
}

function setProgress(val) {
    els.restoreProgress.style.width = val + '%';
    els.restoreProgressText.textContent = val + '%';
}

function showProgress(show) {
    els.restoreProgressArea.classList.toggle('active', show);
    if (!show) setProgress(0);
}

function formatDate() {
    const d = new Date();
    return d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0');
}

function getBackupFormat() {
    const radio = document.querySelector('input[name="modalBackupFormat"]:checked');
    return radio ? radio.value : 'dated';
}

function getBackupFileName(dbName, format) {
    return format === 'dated' ? dbName + '_' + formatDate() + '.bak' : dbName + '.bak';
}

function loadConfig() {
    try {
        const saved = localStorage.getItem('sql_config');
        if (saved) {
            config = JSON.parse(saved);
            els.settingServer.value = config.server || '';
            els.settingUser.value = config.user || '';
            els.settingPass.value = config.password || '';
        }
    } catch (e) {}
}

function saveConfig() {
    config.server = els.settingServer.value.trim();
    config.user = els.settingUser.value.trim();
    config.password = els.settingPass.value;
    localStorage.setItem('sql_config', JSON.stringify(config));
    setStatus(t('settingsSaved'));
    showToast(t('settingsTitle'), t('settingsSaved'), 'success');
    logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('settingsSaved') + ': ' + config.server, 'ok');
}

function getConfig() {
    return {
        server: els.settingServer.value.trim() || config.server,
        user: els.settingUser.value.trim() || config.user,
        password: els.settingPass.value || config.password
    };
}

function switchTab(tabId) {
    els.navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
    els.tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));
    if (tabId === 'manage') refreshDatabases();
    else if (tabId === 'restore') loadFolders();
}

async function testConnection(silent = false) {
    const cfg = getConfig();
    if (!cfg.server) {
        if (!silent) showToast(t('error'), t('enterServer'), 'error');
        return false;
    }
    logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('connectionTest') + ': ' + cfg.server + '...', 'info');
    try {
        setStatus(t('connectionTest'));
        const ok = await invoke('test_connection', { config: cfg });
        setConnectionStatus(ok);
        if (!silent) {
            if (ok) { 
                setStatus(t('connectionOk')); 
                showToast(t('connectionTest'), t('connectionOk'), 'success');
                logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('connectionOk'), 'ok');
            }
            else { 
                setStatus(t('connectionFail')); 
                showToast(t('error'), t('connectionFail'), 'error');
                logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + t('connectionFail'), 'error');
            }
        }
        return ok;
    } catch (e) {
        setConnectionStatus(false);
        logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + t('connectionTest') + ': ' + e, 'error');
        if (!silent) { setStatus(t('error') + ': ' + e); showToast(t('error'), String(e), 'error'); }
        return false;
    }
}

async function browseBak() {
    try {
        const selected = await dialog.open({ multiple: true, filters: [{ name: 'Backup files', extensions: ['bak'] }, { name: 'All files', extensions: ['*'] }] });
        if (selected) {
            bakFiles = Array.isArray(selected) ? selected : [selected];
            if (bakFiles.length === 1) {
                els.bakPath.value = bakFiles[0];
                logRestore(t('restoreProgress') + ': ' + bakFiles[0].split('\\').pop());
            } else {
                els.bakPath.value = bakFiles.length + ' ' + t('filesSelected');
                logRestore(t('massRestoreTitle') + ': ' + bakFiles.length + ' ' + t('filesSelected'));
            }
            els.btnRestore.disabled = !selectedFolder;
        }
    } catch (e) { logRestore(t('error') + ': ' + e, 'error'); }
}

async function loadFolders() {
    if (!isConnected) { els.folderSelect.innerHTML = '<option>' + t('noConnection') + '</option>'; return; }
    try {
        els.folderSelect.innerHTML = '<option>' + t('loadingFolders') + '</option>';
        const folders = await invoke('get_database_folders', { config: getConfig() });
        dbFolders = folders;
        if (folders.length === 0) { els.folderSelect.innerHTML = '<option>' + t('foldersNotFound') + '</option>'; return; }
        els.folderSelect.innerHTML = '';
        folders.forEach(f => { const opt = document.createElement('option'); opt.value = f; opt.textContent = f; els.folderSelect.appendChild(opt); });
        selectedFolder = folders[0];
        els.btnRestore.disabled = bakFiles.length === 0;
        logRestore(t('loadingFolders') + ': ' + folders.length);
    } catch (e) { els.folderSelect.innerHTML = '<option>' + t('loadError') + '</option>'; logRestore(t('loadError') + ': ' + e, 'error'); }
}

function onFolderChange() {
    selectedFolder = els.folderSelect.value;
    els.btnRestore.disabled = bakFiles.length === 0 || !selectedFolder;
}

async function restoreDatabase() {
    if (bakFiles.length === 0 || !selectedFolder) return;
    els.btnRestore.disabled = true;
    showProgress(true);
    clearRestoreLogs();
    let successCount = 0, failCount = 0;
    for (let i = 0; i < bakFiles.length; i++) {
        const bakFile = bakFiles[i];
        const dbName = bakFile.split('\\').pop().replace(/\.bak$/i, '');
        setProgress(Math.round((i / bakFiles.length) * 100));
        logRestore('[' + (i + 1) + '/' + bakFiles.length + '] ' + dbName + '...');
        try {
            const result = await invoke('restore_database', { config: getConfig(), dbName: dbName, bakFile: bakFile, folder: selectedFolder });
            if (result.logs) result.logs.forEach(l => { if (l.includes('[OK]')) logRestore(l, 'ok'); else if (l.includes('[ERROR]')) logRestore(l, 'error'); else if (l.includes('[WARNING]')) logRestore(l, 'warn'); else logRestore(l, 'info'); });
            if (result.success) successCount++;
            else { failCount++; showToast(t('error'), dbName + ': ' + result.message, 'error'); }
        } catch (e) { failCount++; showToast(t('error'), dbName + ': ' + e, 'error'); }
    }
    setProgress(100);
    setTimeout(() => showProgress(false), 2000);
    els.btnRestore.disabled = bakFiles.length === 0 || !selectedFolder;
    if (failCount === 0) { showToast(t('restoreComplete'), t('success') + ': ' + successCount, 'success'); setStatus(t('restoreComplete')); }
    else { showToast(t('restoreComplete'), t('success') + ': ' + successCount + ', ' + t('error') + ': ' + failCount, 'error'); setStatus(t('restoreComplete') + ' ' + successCount + '/' + (successCount + failCount)); }
}

async function refreshDatabases() {
    if (!isConnected) { els.dbTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">' + t('noConnection') + '</td></tr>'; els.dbStatus.textContent = '0 ' + t('databases'); return; }
    try {
        setStatus(t('refresh'));
        logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('refresh') + '...', 'info');
        els.dbTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">' + t('loadingFolders') + '</td></tr>';
        const dbs = await invoke('get_databases', { config: getConfig() });
        if (dbs.length === 0) { els.dbTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">' + t('dbNotFound') + '</td></tr>'; }
        else {
            els.dbTableBody.innerHTML = '';
            dbs.forEach(db => {
                const tr = document.createElement('tr');
                tr.dataset.name = db.name;
                tr.innerHTML = `<td class="col-check"><input type="checkbox" class="db-check"></td><td class="col-name">${escapeHtml(db.name)}</td><td class="col-size">${db.size_mb.toFixed(2)} MB</td><td class="col-status"><span class="status-badge ${db.status.toLowerCase()}">${db.status}</span></td>`;
                tr.addEventListener('click', (e) => { if (e.target.type === 'checkbox') { e.stopPropagation(); updateSelection(); return; } toggleRowSelection(tr, db.name); });
                els.dbTableBody.appendChild(tr);
            });
        }
        els.dbStatus.textContent = dbs.length + ' ' + t('databases');
        setStatus(t('refresh') + ' (' + dbs.length + ')');
        logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('refresh') + ': ' + dbs.length + ' ' + t('databases'), 'ok');
    } catch (e) { 
        els.dbTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">' + t('connError') + '</td></tr>'; 
        setStatus(t('error') + ': ' + e); 
        showToast(t('error'), t('connError') + ': ' + e, 'error'); 
        logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + t('refresh') + ': ' + e, 'error');
    }
}

function toggleRowSelection(tr, name) {
    const checkbox = tr.querySelector('.db-check');
    checkbox.checked = !checkbox.checked;
    updateSelection();
}

function updateSelection() {
    selectedDbs = [];
    document.querySelectorAll('.db-check:checked').forEach(c => { selectedDbs.push(c.closest('tr').dataset.name); });
    const any = selectedDbs.length > 0;
    els.btnBackupDB.disabled = !any;
    els.btnDeleteDB.disabled = !any;
    const allChecks = document.querySelectorAll('.db-check');
    const checkedChecks = document.querySelectorAll('.db-check:checked');
    els.selectAll.checked = allChecks.length > 0 && allChecks.length === checkedChecks.length;
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

async function openBackupModal() {
    if (selectedDbs.length === 0) return;
    els.backupDbList.innerHTML = selectedDbs.map(n => `<div>${escapeHtml(n)}</div>`).join('');
    els.backupPathInput.value = '';
    els.backupModal.classList.add('active');
}

async function browseBackupFolder() {
    try {
        const selected = await dialog.open({ directory: true, multiple: false });
        if (selected) { const folder = Array.isArray(selected) ? selected[0] : selected; els.backupPathInput.value = folder; }
    } catch (e) {}
}

async function confirmBackup() {
    const folder = els.backupPathInput.value;
    if (!folder || selectedDbs.length === 0) return;
    const format = getBackupFormat();
    els.backupModal.classList.remove('active');
    logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('createBackup') + ' ' + selectedDbs.length + ' ' + t('databases') + '...', 'info');
    let successCount = 0, failCount = 0;
    for (const dbName of selectedDbs) {
        const fileName = getBackupFileName(dbName, format);
        const fullPath = folder + '\\' + fileName;
        try {
            setStatus(t('backupSelected') + ' ' + dbName + '...');
            logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('backupSelected') + ' ' + dbName + ' -> ' + fileName + '...', 'info');
            const result = await invoke('create_backup', { config: getConfig(), dbName: dbName, backupPath: fullPath });
            if (result.success) {
                successCount++;
                logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + dbName + ' -> ' + fullPath, 'ok');
            }
            else { 
                failCount++; 
                showToast(t('error'), dbName + ': ' + result.message, 'error');
                logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + dbName + ': ' + result.message, 'error');
            }
        } catch (e) { 
            failCount++; 
            showToast(t('error'), dbName + ': ' + e, 'error');
            logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + dbName + ': ' + e, 'error');
        }
    }
    if (failCount === 0) { 
        showToast(t('backupComplete'), t('success') + ': ' + successCount, 'success');
        logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('backupComplete') + ': ' + successCount + ' ' + t('databases'), 'ok');
    }
    else { 
        showToast(t('backupComplete'), t('success') + ': ' + successCount + ', ' + t('error') + ': ' + failCount, 'error');
        logRestore('[' + new Date().toLocaleTimeString() + '] [WARN] ' + t('backupComplete') + ': ' + successCount + ' ' + t('success') + ', ' + failCount + ' ' + t('error'), 'warn');
    }
    setStatus(t('backupComplete') + ': ' + successCount + '/' + (successCount + failCount));
}

function openDeleteModal() {
    if (selectedDbs.length === 0) return;
    els.deleteDbList.innerHTML = selectedDbs.map(n => `<div>${escapeHtml(n)}</div>`).join('');
    els.deleteModal.classList.add('active');
}

async function confirmDelete() {
    els.deleteModal.classList.remove('active');
    logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('deleteSelected') + ' ' + selectedDbs.length + ' ' + t('databases') + '...', 'info');
    let successCount = 0, failCount = 0;
    for (const dbName of selectedDbs) {
        try {
            setStatus(t('deleteSelected') + ' ' + dbName + '...');
            logRestore('[' + new Date().toLocaleTimeString() + '] ' + t('deleteSelected') + ' ' + dbName + '...', 'info');
            const result = await invoke('delete_database', { config: getConfig(), dbName: dbName });
            if (result.success) {
                successCount++;
                logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('deleteSelected') + ' ' + dbName, 'ok');
            }
            else { 
                failCount++; 
                showToast(t('error'), dbName + ': ' + result.message, 'error');
                logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + dbName + ': ' + result.message, 'error');
            }
        } catch (e) { 
            failCount++; 
            showToast(t('error'), dbName + ': ' + e, 'error');
            logRestore('[' + new Date().toLocaleTimeString() + '] [ERROR] ' + dbName + ': ' + e, 'error');
        }
    }
    selectedDbs = [];
    els.btnBackupDB.disabled = true;
    els.btnDeleteDB.disabled = true;
    refreshDatabases();
    if (failCount === 0) { 
        showToast(t('deleteComplete'), t('success') + ': ' + successCount, 'success');
        logRestore('[' + new Date().toLocaleTimeString() + '] [OK] ' + t('deleteComplete') + ': ' + successCount + ' ' + t('databases'), 'ok');
    }
    else { 
        showToast(t('deleteComplete'), t('success') + ': ' + successCount + ', ' + t('error') + ': ' + failCount, 'error');
        logRestore('[' + new Date().toLocaleTimeString() + '] [WARN] ' + t('deleteComplete') + ': ' + successCount + ' ' + t('success') + ', ' + failCount + ' ' + t('error'), 'warn');
    }
    setStatus(t('deleteComplete') + ': ' + successCount + '/' + (successCount + failCount));
}

async function minimizeWindow() { try { const appWindow = tauriWindow.getCurrent(); await appWindow.minimize(); } catch (e) {} }
async function toggleMaximize() { try { const appWindow = tauriWindow.getCurrent(); const isMax = await appWindow.isMaximized(); if (isMax) await appWindow.unmaximize(); else await appWindow.maximize(); } catch (e) {} }
async function closeWindow() { try { const appWindow = tauriWindow.getCurrent(); await appWindow.close(); } catch (e) {} }

function bindEvents() {
    els.navItems.forEach(n => n.addEventListener('click', () => switchTab(n.dataset.tab)));
    els.btnMinimize.addEventListener('click', minimizeWindow);
    els.btnMaximize.addEventListener('click', toggleMaximize);
    els.btnClose.addEventListener('click', closeWindow);
    els.btnBrowseBak.addEventListener('click', browseBak);
    els.folderSelect.addEventListener('change', onFolderChange);
    els.btnRestore.addEventListener('click', restoreDatabase);
    els.btnClearRestore.addEventListener('click', () => { bakFiles = []; els.bakPath.value = ''; els.btnRestore.disabled = true; clearRestoreLogs(); });
    els.btnClearLogs.addEventListener('click', clearRestoreLogs);
    els.btnRefreshDB.addEventListener('click', refreshDatabases);
    els.btnBackupDB.addEventListener('click', openBackupModal);
    els.btnDeleteDB.addEventListener('click', openDeleteModal);
    els.selectAll.addEventListener('change', (e) => { document.querySelectorAll('.db-check').forEach(c => c.checked = e.target.checked); updateSelection(); });
    els.btnTestConn.addEventListener('click', () => testConnection(false));
    els.btnSaveSettings.addEventListener('click', () => { saveConfig(); testConnection(false); });
    els.btnCancelDelete.addEventListener('click', () => els.deleteModal.classList.remove('active'));
    els.btnConfirmDelete.addEventListener('click', confirmDelete);
    els.btnCancelBackup.addEventListener('click', () => els.backupModal.classList.remove('active'));
    els.btnBrowseBackup.addEventListener('click', browseBackupFolder);
    els.btnConfirmBackup.addEventListener('click', confirmBackup);
    els.deleteModal.addEventListener('click', (e) => { if (e.target === els.deleteModal) els.deleteModal.classList.remove('active'); });
    els.backupModal.addEventListener('click', (e) => { if (e.target === els.backupModal) els.backupModal.classList.remove('active'); });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
}

document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    loadConfig();
    setLanguage(currentLang);
    bindEvents();
    setTimeout(async () => { await testConnection(true); if (isConnected) loadFolders(); }, 500);
});
