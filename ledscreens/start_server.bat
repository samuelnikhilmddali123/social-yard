@echo off
TITLE LED Server Build - CPU Server and Cloudflare Tunnel
COLOR 0A

echo ===================================================
echo     Starting LED Screens CPU Server and Cloudflare
echo ===================================================
echo.

cd /d "c:\led_server"

:: 1. Start Cloudflare Tunnel process in background if not running
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] Cloudflare Tunnel is already running.
) else (
    echo [INFO] Starting Cloudflare Tunnel process...
    start "Cloudflare Tunnel" /min "c:\led_server\cloudflared.exe" tunnel run --token eyJhIjoiMjQ2ZDQxN2Q1YzNkMGRlYTA3NDA4ZDFlYzAyNmMzOGMiLCJ0IjoiNjczNTJiOWEtNjFhZC00ODJlLWE0ZDAtZWZiYTMyZThjZDNmIiwicyI6Ik5UaGpNR0kzTmprdE1EVTNOaTAwTVRWakxUbG1NMkl0T1dReFkyWTFZVE0xWlRCaCJ9
)

:server_loop
cd /d "c:\led_server"
echo.
echo [INFO] Fetching latest updates from GitHub...
"C:\Program Files\Git\cmd\git.exe" pull origin main

cd /d "c:\led_server\backend"

:: Free Port 5000 if an old node instance was still bound
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a 2>nul

echo.
echo [INFO] Starting Backend CPU Server on Port 5000 (Auto-reload enabled)...
call npm start
echo [INFO] Server restarted by auto-updater. Reloading...
timeout /t 2 /nobreak >nul
goto server_loop
