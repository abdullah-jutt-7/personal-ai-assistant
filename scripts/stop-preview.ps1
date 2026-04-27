$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distRoot = Join-Path $repoRoot "dist\preview"

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "stop-app.ps1") -Mode all -RootPath $distRoot
