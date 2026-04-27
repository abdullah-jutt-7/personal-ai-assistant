$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendStandalone = Join-Path $repoRoot "frontend\.next\standalone"
$frontendStatic = Join-Path $repoRoot "frontend\.next\static"
$frontendPublic = Join-Path $repoRoot "frontend\public"
$backendSource = Join-Path $repoRoot "backend"
$distRoot = Join-Path $repoRoot "dist\preview"

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
Copy-Item -Path (Join-Path $repoRoot "scripts\run-preview.ps1") -Destination (Join-Path $distRoot "run-preview.ps1") -Force

$launcher = @'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%run-preview.ps1"
'@
Set-Content -Path (Join-Path $distRoot "run-preview.cmd") -Value $launcher -Encoding ASCII

Write-Host "Preview package staged at $distRoot"
