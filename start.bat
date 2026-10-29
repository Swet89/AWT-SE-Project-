@echo off
title Odyssey Travel Launcher
echo ===================================================
echo           Starting Odyssey Travel Website
echo ===================================================

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%odyssey-travel\backend
set FRONTEND_DIR=%ROOT_DIR%odyssey-travel\frontend
set MONGO_BIN=%BACKEND_DIR%\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-8.2.6.exe
set MONGO_DATA=%BACKEND_DIR%\data\db

if not exist "%MONGO_DATA%" mkdir "%MONGO_DATA%"

echo [1/3] Starting Local MongoDB Database...
start "Odyssey Travel - MongoDB" /min "%MONGO_BIN%" --dbpath "%MONGO_DATA%" --port 27017 --bind_ip 127.0.0.1

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend API (Port 5000)...
start "Odyssey Travel - Backend API" cmd /k "cd /d "%BACKEND_DIR%" && node server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Vite Server (Port 5173)...
start "Odyssey Travel - Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

timeout /t 3 /nobreak >nul

echo Launching browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo Odyssey Travel is running!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo ===================================================
