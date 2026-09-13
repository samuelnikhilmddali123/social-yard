@echo off
title E3Di CCTV Camera Edge Relay Agent (Dual Camera Gateway)
color 0a
:loop
cls
echo ============================================================================
echo   E3Di CCTV Camera Edge Relay Agent (Dual Camera Gateway)
echo   Local Cameras:
echo     [1] Camera 1: 192.168.1.108:554 (sparsh-main)
echo     [2] Camera 2: 192.168.1.4:554   (sparsh-cam2)
echo.
echo   Pushing live HLS video streams OUTBOUND to:
echo     https://api.e3di.org
echo.
echo   You can view the live streams from ANY network / mobile data anywhere!
echo ============================================================================
echo.

cd /d "%~dp0edge-agent"
node edgeAgent.js

echo.
echo [WARNING] Edge Agent exited. Auto-restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop

