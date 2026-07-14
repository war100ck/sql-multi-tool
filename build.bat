@echo off
chcp 65001 >nul
echo ==========================================
echo SQL Multi Tool - Build
echo ==========================================
echo.

cd /d "%~dp0"

if not exist "src-tauri\Cargo.toml" (
    echo [ERROR] Cargo.toml not found!
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
cd src-tauri
cargo fetch
cd ..

echo [2/3] Building release...
cd src-tauri
cargo build --release
cd ..

echo [3/3] Build complete!
echo.
echo Executable: src-tauri\target\release\sql-multi-tool.exe
echo.
echo NOTE: To hide console window, add to Cargo.toml:
echo   [profile.release]
echo   panic = "abort"
echo.
echo Or use: cargo tauri build --target x86_64-pc-windows-msvc
echo.
pause
