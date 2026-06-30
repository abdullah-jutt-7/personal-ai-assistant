@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%launch-app.ps1" -Mode preview -RootPath "%SCRIPT_DIR%"
