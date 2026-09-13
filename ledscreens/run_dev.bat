@echo off
TITLE LED Server Monorepo - Backend and Frontend Development
COLOR 0B

echo ===================================================
echo   Starting LED Screens Full Stack (Backend + Frontend)
echo ===================================================
echo.

cd /d "c:\led_server"

:: Pull latest code from GitHub
echo [INFO] Pulling latest updates from GitHub...
"C:\Program Files\Git\cmd\git.exe" pull origin main

:: Start Cloudflare Tunnel
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] Cloudflare Tunnel is already running.
) else (
    echo [INFO] Starting Cloudflare Tunnel in background...
    start "Cloudflare Tunnel" /min "c:\led_server\cloudflared.exe" tunnel run --token eyJhIjoiMjQ2ZDQxN2Q1YzNkMGRlYTA3NDA4ZDFlYzAyNmMzOGMiLCJ0IjoiNjczNTJiOWEtNjFhZC00ODJlLWE0ZDAtZWZiYTMyZThjZDNmIiwicyI6Ik5UaGpNR0kzTmprdE1EVTNOaTAwTVRWakxUbG1NMkl0T1dReFkyWTFZVE0xWlRCaCJ9
)

:: Start Backend
start "LED Backend Server" cmd /k "cd /d c:\led_server\backend && npm start"

:: Start Frontend
start "LED Frontend App" cmd /k "cd /d c:\led_server\frontend && npm run dev"

echo [SUCCESS] Backend and Frontend servers launched!
