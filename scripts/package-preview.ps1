$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendStandalone = Join-Path $repoRoot "frontend\.next\standalone"
$frontendStatic = Join-Path $repoRoot "frontend\.next\static"
$frontendPublic = Join-Path $repoRoot "frontend\public"
$backendSource = Join-Path $repoRoot "backend"
$distRoot = Join-Path $repoRoot "dist\preview"
$repoPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $repoPython)) {
  throw "Missing repository Python interpreter at $repoPython. Create the project venv before packaging."
}

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\stop-preview.ps1") | Out-Null

if (-not (Test-Path $frontendStandalone)) {
  throw "Missing standalone frontend build output at $frontendStandalone. Run the frontend build first."
}

if (-not (Test-Path $distRoot)) {
  New-Item -ItemType Directory -Path $distRoot | Out-Null
}

Get-ChildItem -LiteralPath $distRoot -Force |
  Where-Object { $_.Name -ne "data" } |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Copy-Item -Path (Join-Path $frontendStandalone "*") -Destination $distRoot -Recurse -Force

$distFrontend = Join-Path $distRoot "frontend"
$distFrontendNext = Join-Path $distFrontend ".next"

New-Item -ItemType Directory -Path $distFrontendNext -Force | Out-Null

if (Test-Path $frontendStatic) {
  Copy-Item -Path $frontendStatic -Destination (Join-Path $distFrontendNext "static") -Recurse -Force
}

if (Test-Path $frontendPublic) {
  Copy-Item -Path $frontendPublic -Destination (Join-Path $distFrontend "public") -Recurse -Force
}

Copy-Item -Path $backendSource -Destination (Join-Path $distRoot "backend") -Recurse -Force
Copy-Item -Path (Join-Path $repoRoot "requirements.txt") -Destination $distRoot -Force
Copy-Item -Path (Join-Path $repoRoot "README.md") -Destination $distRoot -Force
Copy-Item -Path (Join-Path $repoRoot "scripts\launch-app.ps1") -Destination (Join-Path $distRoot "launch-app.ps1") -Force
Copy-Item -Path (Join-Path $repoRoot "scripts\stop-app.ps1") -Destination (Join-Path $distRoot "stop-app.ps1") -Force
Copy-Item -Path (Join-Path $repoRoot "scripts\run-preview.ps1") -Destination (Join-Path $distRoot "run-preview.ps1") -Force
Copy-Item -Path (Join-Path $repoRoot "scripts\stop-preview.ps1") -Destination (Join-Path $distRoot "stop-preview.ps1") -Force
Copy-Item -Path (Join-Path $repoRoot "scripts\bootstrap-ollama.ps1") -Destination (Join-Path $distRoot "bootstrap-ollama.ps1") -Force

$distVenv = Join-Path $distRoot ".venv"
& $repoPython -m venv $distVenv

$distPython = Join-Path $distVenv "Scripts\python.exe"
if (-not (Test-Path $distPython)) {
  throw "Failed to create preview venv at $distVenv."
}

& $distPython -m pip install --upgrade pip | Out-Null
& $distPython -m pip install -r (Join-Path $distRoot "requirements.txt") | Out-Null

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
  Copy-Item -Path $nodeCommand.Source -Destination (Join-Path $distRoot "node.exe") -Force
} else {
  throw "Could not find node.exe on this machine. Install Node.js before packaging the preview bundle."
}

$launcher = @'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%launch-app.ps1" -Mode preview -RootPath "%SCRIPT_DIR%"
'@
Set-Content -Path (Join-Path $distRoot "run-app.cmd") -Value $launcher -Encoding ASCII

$previewLauncher = @'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
call "%SCRIPT_DIR%run-app.cmd"
'@
Set-Content -Path (Join-Path $distRoot "run-preview.cmd") -Value $previewLauncher -Encoding ASCII

$stopLauncher = @'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%stop-app.ps1" -Mode all -RootPath "%SCRIPT_DIR%"
'@
Set-Content -Path (Join-Path $distRoot "stop-app.cmd") -Value $stopLauncher -Encoding ASCII

$previewStopLauncher = @'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
call "%SCRIPT_DIR%stop-app.cmd"
'@
Set-Content -Path (Join-Path $distRoot "stop-preview.cmd") -Value $previewStopLauncher -Encoding ASCII

Write-Host "Preview package staged at $distRoot"
