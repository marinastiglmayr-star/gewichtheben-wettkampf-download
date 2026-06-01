@echo off
setlocal
set "APP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%installer\install-windows.ps1"
echo.
pause
