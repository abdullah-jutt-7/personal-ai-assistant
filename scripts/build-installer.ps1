$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$previewRoot = Join-Path $repoRoot "dist\preview"
$installerRoot = Join-Path $repoRoot "dist\installer"
$templatePath = Join-Path $repoRoot "installer\IntelliText.iss.template"

if (-not (Test-Path $previewRoot)) {
  throw "Missing preview bundle at $previewRoot. Run `npm run package:preview` first."
}

if (-not (Test-Path $templatePath)) {
  throw "Missing installer template at $templatePath."
}

& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $repoRoot "scripts\all-stop.ps1") | Out-Null

if (Test-Path $installerRoot) {
  Remove-Item -LiteralPath $installerRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $installerRoot | Out-Null

$compiledPreviewRoot = $previewRoot -replace '\\', '\\\\'
$compiledOutputDir = $installerRoot -replace '\\', '\\\\'

$template = Get-Content $templatePath -Raw
$generatedIss = $template.
  Replace("__SOURCE_DIR__", $compiledPreviewRoot).
  Replace("__OUTPUT_DIR__", $compiledOutputDir)

$generatedIssPath = Join-Path $installerRoot "IntelliText.generated.iss"
Set-Content -Path $generatedIssPath -Value $generatedIss -Encoding ASCII

$iscc = Get-Command iscc -ErrorAction SilentlyContinue
if (-not $iscc) {
  Write-Host "Inno Setup Compiler was not found."
  Write-Host "Generated installer script: $generatedIssPath"
  Write-Host "Install Inno Setup and run it against the generated script to build the final .exe."
  return
}

& $iscc.Source $generatedIssPath
