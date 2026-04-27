$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "stop-preview.ps1") | Out-Null
& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "stop-app.ps1") -Mode backend -RootPath $repoRoot | Out-Null
