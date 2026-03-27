@echo off
title Phantom Launcher
echo.
echo  Starting Phantom...
echo.

start "Phantom — Backend" cmd /k "cd /d %~dp0backend && py -m fastapi dev src/api.py"
timeout /t 3 /nobreak >nul

start "Phantom — Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul

start http://localhost:5173
