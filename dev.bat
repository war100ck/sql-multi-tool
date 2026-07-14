@echo off
chcp 65001 >nul
echo ==========================================
echo SQL Multi Tool - Dev Mode
echo ==========================================
echo.

cd /d "%~dp0"

if not exist "src-tauri\Cargo.toml" (
    echo [ERROR] Cargo.toml not found!
    pause
    exit /b 1
)

echo Starting Tauri dev server...
cd src-tauri
cargo tauri dev
cd ..
