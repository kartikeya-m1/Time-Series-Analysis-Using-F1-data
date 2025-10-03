@echo off
title F1 Hyperspeed Dashboard - Development Server
echo ========================================
echo    F1 Hyperspeed Dashboard
echo    Starting Development Environment
echo ========================================
echo.

echo [1/2] Starting Backend (Flask API)...
cd /d "e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard\backend"
start "F1 Backend" cmd /k "python api/f1_api.py"

echo [2/2] Starting Frontend (React App)...
cd /d "e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard\frontend"
start "F1 Frontend" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo 📍 Access points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo 🎮 Controls:
echo   H = Toggle UI
echo   T = Toggle Charts
echo   ESC = Show UI
echo.
echo 🏎️ Ready to race! Close this window when done.
pause