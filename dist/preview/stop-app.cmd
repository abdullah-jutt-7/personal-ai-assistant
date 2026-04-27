@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%stop-app.ps1" -Mode all -RootPath "%SCRIPT_DIR%"
