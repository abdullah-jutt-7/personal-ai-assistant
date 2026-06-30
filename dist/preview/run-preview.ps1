$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distRoot = Join-Path $repoRoot "dist\preview"

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "launch-app.ps1") -Mode preview -RootPath $distRoot
