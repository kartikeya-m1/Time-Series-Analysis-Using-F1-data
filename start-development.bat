@echo off
title F1 Hyperspeed Dashboard - Development Server
echo ========================================
echo    F1 Hyperspeed Dashboard
echo    Enhanced FastF1 Integration
echo ========================================
echo.

echo [1/3] Installing/Updating FastF1 Dependencies...
cd /d "e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard\backend"
pip install -r requirements.txt --quiet

echo [2/3] Starting Backend (Flask API with FastF1)...
start "F1 Backend - FastF1 API" cmd /k "python api/f1_api.py"

echo [3/3] Starting Frontend (React App)...
cd /d "e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard\frontend"
start "F1 Frontend - Hyperspeed UI" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo 📍 Access points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   API Health: http://localhost:5000/api/health
echo.
echo 🎮 Enhanced Controls:
echo   H = Toggle UI Panel
echo   T = Toggle Telemetry Charts  
echo   I = Toggle Info Panel (Weather/Tires)
echo   ESC = Show All UI
echo   Mouse Hold = Hyperspeed Mode
echo.
echo 🏎️ FastF1 Features:
echo   • Real F1 telemetry data (2018-2025)
echo   • Official lap times and sectors
echo   • Tire compound strategies
echo   • Weather conditions
echo   • Driver performance metrics
echo   • Enhanced hyperspeed effects
echo.
echo 🔧 Optional: Test FastF1 Integration
echo   Run: python test_fastf1_integration.py
echo.
echo 🏁 Ready to race! Close this window when done.
timeout /t 5 >nul
echo.
echo Starting integration test in 5 seconds...
cd /d "e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard"
timeout /t 5 >nul
python test_fastf1_integration.py
pause