$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
$previewRoot = if (Test-Path (Join-Path $scriptRoot "backend")) {
  $scriptRoot
} else {
  Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) "dist\preview"
}

if (-not (Test-Path (Join-Path $previewRoot "backend"))) {
  throw "Missing preview backend at $previewRoot. Run `npm run package:preview` first."
}

if (-not (Test-Path (Join-Path $previewRoot "frontend"))) {
  throw "Missing preview frontend at $previewRoot. Run `npm run package:preview` first."
}

$pythonCandidates = @(
  (Join-Path $scriptRoot ".venv\Scripts\python.exe"),
  (Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) ".venv\Scripts\python.exe"),
  (Join-Path (Resolve-Path (Join-Path $scriptRoot "..\..")) ".venv\Scripts\python.exe")
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $pythonExe) {
  throw "Could not find a project Python interpreter. Activate the repo .venv or create one before running preview."
}

$backendDir = Join-Path $previewRoot "backend"
$frontendDir = Join-Path $previewRoot "frontend"
$logDir = Join-Path $previewRoot "logs"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$backendStdoutLog = Join-Path $logDir "backend.out.log"
$backendStderrLog = Join-Path $logDir "backend.err.log"
$frontendStdoutLog = Join-Path $logDir "frontend.out.log"
$frontendStderrLog = Join-Path $logDir "frontend.err.log"

$backendProcess = Start-Process `
  -FilePath $pythonExe `
  -ArgumentList "-m backend.app.main" `
  -WorkingDirectory $previewRoot `
  -WindowStyle Hidden `
  -PassThru `
  -RedirectStandardOutput $backendStdoutLog `
  -RedirectStandardError $backendStderrLog

$frontendProcess = Start-Process `
  -FilePath "node" `
  -ArgumentList "frontend/server.js" `
  -WorkingDirectory $previewRoot `
  -WindowStyle Hidden `
  -PassThru `
  -RedirectStandardOutput $frontendStdoutLog `
  -RedirectStandardError $frontendStderrLog

@{
  backend_pid = $backendProcess.Id
  frontend_pid = $frontendProcess.Id
} | ConvertTo-Json | Set-Content -Path (Join-Path $logDir "preview.pids.json") -Encoding ASCII

Write-Host "Preview app started."
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Frontend: http://127.0.0.1:3000"
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Logs: $logDir"
