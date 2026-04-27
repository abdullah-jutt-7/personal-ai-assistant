param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("backend", "all")]
  [string]$Mode = "all",

  [Parameter(Mandatory = $false)]
  [string]$RootPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $RootPath) {
  $scriptRoot = $PSScriptRoot
  $RootPath = if (Test-Path (Join-Path $scriptRoot "backend")) {
    $scriptRoot
  } else {
    Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) "dist\preview"
  }
}

$pidFile = Join-Path $RootPath "logs\app.pids.json"

if (Test-Path $pidFile) {
  $state = Get-Content $pidFile -Raw | ConvertFrom-Json
  $processIds = @($state.backend_pid, $state.frontend_pid) | Where-Object { $_ }

  foreach ($processId in $processIds) {
    try {
      & taskkill /PID $processId /T /F 2>$null | Out-Null
      Write-Host "Stopped app process $processId"
    } catch {
      Write-Host "Could not stop app process $($processId): $($_.Exception.Message)"
    }
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$portsToClear = if ($Mode -eq "backend") { @(8000) } else { @(3000, 8000) }
foreach ($port in $portsToClear) {
  $listenerLines = netstat -ano | Select-String ":$port"
  $listenerPids = @()
  foreach ($line in $listenerLines) {
    $parts = ($line.Line -split '\s+') | Where-Object { $_ }
    $listenerPid = $parts[-1]
    if ($listenerPid -and $listenerPid -match '^\d+$') {
      $listenerPids += [int]$listenerPid
    }
  }

  foreach ($listenerPid in $listenerPids | Sort-Object -Unique) {
    try {
      & taskkill /PID $listenerPid /T /F 2>$null | Out-Null
      Write-Host "Stopped listener on port $port (PID $listenerPid)"
    } catch {
      Write-Host "Could not stop listener on port $port (PID $listenerPid): $($_.Exception.Message)"
    }
  }
}
