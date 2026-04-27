$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
$previewRoot = if (Test-Path (Join-Path $scriptRoot "backend")) {
  $scriptRoot
} else {
  Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) "dist\preview"
}

$pidFile = Join-Path $previewRoot "logs\preview.pids.json"

if (-not (Test-Path $pidFile)) {
  Write-Host "No preview pid file found at $pidFile."
  return
}

$state = Get-Content $pidFile -Raw | ConvertFrom-Json
$processIds = @($state.backend_pid, $state.frontend_pid) | Where-Object { $_ }

foreach ($processId in $processIds) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Host "Stopped preview process $processId"
  } catch {
    Write-Host "Could not stop process $($processId): $($_.Exception.Message)"
  }
}

Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
