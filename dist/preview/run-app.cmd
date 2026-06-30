@echo off
setlocal
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%IntelliText.exe" (
  start "" "%SCRIPT_DIR%IntelliText.exe"
) else (
  powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%launch-app.ps1" -Mode preview -RootPath "%SCRIPT_DIR%"
)
