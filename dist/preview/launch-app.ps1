param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("preview", "package")]
  [string]$Mode = "preview",

  [Parameter(Mandatory = $false)]
  [string]$RootPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $RootPath) {
  $scriptRoot = $PSScriptRoot
  $RootPath = if ($Mode -eq "preview" -and (Test-Path (Join-Path $scriptRoot "backend"))) {
    $scriptRoot
  } else {
    Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) "dist\preview"
  }
}

if (-not (Test-Path (Join-Path $RootPath "backend"))) {
  throw "Missing backend at $RootPath. Run the package step first."
}

if (-not (Test-Path (Join-Path $RootPath "frontend"))) {
  throw "Missing frontend at $RootPath. Run the package step first."
}

$stopScript = Join-Path $PSScriptRoot "stop-app.ps1"
if (Test-Path $stopScript) {
  try {
    & powershell.exe -ExecutionPolicy Bypass -File $stopScript -Mode all -RootPath $RootPath | Out-Null
  } catch {
    Write-Host "Previous IntelliText instance cleanup was skipped: $($_.Exception.Message)"
  }
}

$bootstrapScript = Join-Path $RootPath "bootstrap-ollama.ps1"
$skipOllamaBootstrap = $env:INTELLITEXT_SKIP_OLLAMA_BOOTSTRAP -eq "1"
$bundledModelsDir = Join-Path $RootPath "models"
$bundledOllamaExe = Join-Path $RootPath "ollama\ollama.exe"
$bundledOllamaBaseUrl = "http://127.0.0.1:11435"
$previousOllamaBaseUrl = $env:OLLAMA_BASE_URL
$env:OLLAMA_BASE_URL = $bundledOllamaBaseUrl

if (-not $skipOllamaBootstrap -and (Test-Path $bootstrapScript)) {
  $bootstrapLogDir = Join-Path $RootPath "logs"
  New-Item -ItemType Directory -Path $bootstrapLogDir -Force | Out-Null

  $bootstrapStdoutLog = Join-Path $bootstrapLogDir "bootstrap.out.log"
  $bootstrapStderrLog = Join-Path $bootstrapLogDir "bootstrap.err.log"

  Write-Host "Checking Ollama runtime and model availability in the background..."
  Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $bootstrapScript,
      "-ModelNames",
      "deepseek-r1:1.5b",
      "qwen3:1.7b",
      "-ModelsDir",
      $bundledModelsDir,
      "-OllamaExePath",
      $bundledOllamaExe,
      "-OllamaBaseUrl",
      $bundledOllamaBaseUrl
    ) `
    -WorkingDirectory $RootPath `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $bootstrapStdoutLog `
    -RedirectStandardError $bootstrapStderrLog | Out-Null
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$pythonCandidates = @(
  (Join-Path $RootPath ".venv\Scripts\python.exe"),
  (Join-Path $PSScriptRoot ".venv\Scripts\python.exe"),
  (Join-Path $repoRoot ".venv\Scripts\python.exe")
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $pythonExe) {
  throw "Could not find a project Python interpreter. Activate the repo .venv or create one before launching."
}

$nodeCandidates = @(
  (Join-Path $RootPath "node.exe"),
  (Join-Path $PSScriptRoot "node.exe")
)

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
  $nodeCandidates += $nodeCommand.Source
}

$nodeExe = $nodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $nodeExe) {
  throw "Could not find node.exe. Package the preview bundle or install Node.js before launching."
}

$logDir = Join-Path $RootPath "logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$backendStdoutLog = Join-Path $logDir "backend.out.log"
$backendStderrLog = Join-Path $logDir "backend.err.log"
$frontendStdoutLog = Join-Path $logDir "frontend.out.log"
$frontendStderrLog = Join-Path $logDir "frontend.err.log"

try {
  $backendProcess = Start-Process `
    -FilePath $pythonExe `
    -ArgumentList @(
      "-m",
      "uvicorn",
      "backend.app.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      "8000"
    ) `
    -WorkingDirectory $RootPath `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $backendStdoutLog `
    -RedirectStandardError $backendStderrLog

  $frontendProcess = Start-Process `
    -FilePath $nodeExe `
    -ArgumentList "frontend/server.js" `
    -WorkingDirectory $RootPath `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $frontendStdoutLog `
    -RedirectStandardError $frontendStderrLog
} finally {
  if ($null -ne $previousOllamaBaseUrl) {
    $env:OLLAMA_BASE_URL = $previousOllamaBaseUrl
  } else {
    Remove-Item Env:\OLLAMA_BASE_URL -ErrorAction SilentlyContinue
  }
}

@{
  backend_pid = $backendProcess.Id
  frontend_pid = $frontendProcess.Id
  mode = $Mode
  root_path = $RootPath
} | ConvertTo-Json | Set-Content -Path (Join-Path $logDir "app.pids.json") -Encoding ASCII

Write-Host "App started."
Write-Host "Mode: $Mode"
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Frontend: http://127.0.0.1:3000"
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Ollama: $bundledOllamaBaseUrl"
Write-Host "Logs: $logDir"
