@echo off
TITLE Cinema Management - Auto Starter
echo ==========================================
echo    Cinema Management System - Khoi dong
echo ==========================================

:: 1. Kiem tra Docker Desktop
echo [1/3] Dang kiem tra Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Docker chua duoc bat. Vui long mo Docker Desktop truoc!
    pause
    exit /b
)

:: 2. Chay Docker Compose
echo [2/3] Dang khoi chay cac services (MySQL, Redis, Backend, Frontend)...
docker compose up -d
if %errorlevel% neq 0 (
    echo [LOI] Khong the khoi chay Docker Compose.
    pause
    exit /b
)

:: 3. Mo trinh duyet
echo [3/3] Dang mo website...
timeout /t 5 >nul
start http://localhost:3000

echo ==========================================
echo    DA XONG! He thong dang chay ngam.
echo    - Web: http://localhost:3000
echo    - API: http://localhost:8081/api
echo ==========================================
pause
