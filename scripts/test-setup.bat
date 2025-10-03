@echo off
echo ========================================
echo    F1 Hyperspeed Dashboard Test Suite
echo ========================================
echo.

echo [1/4] Checking project structure...
if exist "frontend\src\App.js" (
    echo ✓ Frontend structure OK
) else (
    echo ✗ Frontend structure missing
    exit /b 1
)

if exist "backend\api\f1_api.py" (
    echo ✓ Backend structure OK
) else (
    echo ✗ Backend structure missing
    exit /b 1
)

echo.
echo [2/4] Checking frontend dependencies...
cd frontend
if exist "package.json" (
    echo ✓ package.json found
    echo   Installing dependencies...
    call npm install --silent
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Frontend dependencies installed
    ) else (
        echo ✗ Frontend dependency installation failed
    )
) else (
    echo ✗ package.json missing
)

echo.
echo [3/4] Checking backend dependencies...
cd ..\backend
if exist "requirements.txt" (
    echo ✓ requirements.txt found
    echo   Python version:
    python --version
    echo   Installing dependencies...
    pip install -r requirements.txt --quiet
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Backend dependencies installed
    ) else (
        echo ✗ Backend dependency installation failed
    )
) else (
    echo ✗ requirements.txt missing
)

cd..

echo.
echo [4/4] Project restructuring complete!
echo.
echo 🚀 Next steps:
echo   1. cd frontend && npm start
echo   2. cd backend && python api/f1_api.py
echo.
echo ✨ F1 Hyperspeed Dashboard is ready for development!
echo ========================================