param(
  [Parameter(Mandatory = $false)]
  [string]$ModelName = "qwen3:4b",

  [Parameter(Mandatory = $false)]
  [int]$ReadyTimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

function Get-OllamaCommand {
  $command = Get-Command ollama -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $defaultPaths = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"),
    (Join-Path $env:ProgramFiles "Ollama\ollama.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Ollama\ollama.exe")
  )

  return $defaultPaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}

function Test-OllamaApiReady {
  try {
    Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Wait-OllamaApiReady {
  param(
    [Parameter(Mandatory = $true)]
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-OllamaApiReady) {
      return $true
    }

    Start-Sleep -Seconds 2
  }

  return $false
}

$ollamaExe = Get-OllamaCommand
if (-not $ollamaExe) {
  Write-Host "Installing Ollama from the official Windows installer..."
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "irm https://ollama.com/install.ps1 | iex"
  $ollamaExe = Get-OllamaCommand
}

if (-not $ollamaExe) {
  throw "Ollama could not be found after installation."
}

if (-not (Test-OllamaApiReady)) {
  try {
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden | Out-Null
  } catch {
    Write-Host "Ollama server may already be running: $($_.Exception.Message)"
  }
}

if (-not (Wait-OllamaApiReady -TimeoutSeconds $ReadyTimeoutSeconds)) {
  throw "Ollama did not become ready at http://127.0.0.1:11434."
}

$tagsResponse = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 15
$existingModels = @()
if ($tagsResponse.models) {
  $existingModels = @($tagsResponse.models | ForEach-Object { $_.name })
}

if ($existingModels -notcontains $ModelName) {
  Write-Host "Downloading Ollama model $ModelName..."
  & $ollamaExe pull $ModelName
}
