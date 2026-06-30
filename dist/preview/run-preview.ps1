$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distRoot = Join-Path $repoRoot "dist\preview"

$hostExe = Join-Path $distRoot "IntelliText.exe"
if (Test-Path $hostExe) {
  Start-Process -FilePath $hostExe -WorkingDirectory $distRoot | Out-Null
} else {
  & powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "launch-app.ps1") -Mode preview -RootPath $distRoot
}
