@echo off
echo =====================================
echo   F1 Dashboard Cleanup Script
echo =====================================
echo.

set "OLD_DIR=..\f1-dashboard"
set "NEW_DIR=.\F1-Hyperspeed-Dashboard"

echo Checking project structure...

if exist "%OLD_DIR%" (
    echo ✓ Found old project: %OLD_DIR%
) else (
    echo ❌ Old project directory not found
    pause
    exit /b 1
)

if exist "%NEW_DIR%\frontend\src\App.js" (
    echo ✓ New project structure verified
) else (
    echo ❌ New project structure incomplete
    echo Please ensure F1-Hyperspeed-Dashboard is properly set up
    pause
    exit /b 1
)

echo.
echo ⚠️  WARNING: This will permanently delete:
echo   - %OLD_DIR%\src\           (Old React source code)
echo   - %OLD_DIR%\backend\       (Old backend files)
echo   - %OLD_DIR%\node_modules\  (Dependencies - can be reinstalled)
echo   - %OLD_DIR%\public\        (Public assets - already copied)
echo   - %OLD_DIR%\package.json   (Package config - already copied)
echo.

set /p "confirm=Continue with cleanup? [y/N]: "

if /i "%confirm%"=="y" goto :cleanup
if /i "%confirm%"=="yes" goto :cleanup

echo ❌ Cleanup cancelled
pause
exit /b 0

:cleanup
echo.
echo 🗑️  Removing old project directory...

rd /s /q "%OLD_DIR%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully removed old project structure
) else (
    echo ❌ Failed to remove old directory
    echo Try running as administrator or close any open files
    pause
    exit /b 1
)

echo.
echo 🎉 Cleanup complete!
echo.
echo 📁 Clean project structure:
dir /b ".."
echo.
echo 🚀 Your F1 Dashboard is now at:
echo    %CD%
echo.
echo Next steps:
echo   1. cd frontend
echo   2. npm install
echo   3. npm start
echo.
pause