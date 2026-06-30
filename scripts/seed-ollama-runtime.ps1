$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ollamaInstallRoots = @(
  (Join-Path $env:LOCALAPPDATA "Programs\Ollama"),
  (Join-Path $env:ProgramFiles "Ollama"),
  (Join-Path ${env:ProgramFiles(x86)} "Ollama")
)

$sourceRoot = $ollamaInstallRoots | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $sourceRoot) {
  throw "Could not find an installed Ollama runtime to seed from."
}

$targetRoot = Join-Path $repoRoot "ollama"
New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null

Get-ChildItem -LiteralPath $targetRoot -Force |
  Where-Object { $_.Name -ne "README.md" } |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

$runtimeItems = @(
  "ollama.exe",
  "ollama app.exe",
  "app.ico",
  "lib"
)

foreach ($item in $runtimeItems) {
  $sourcePath = Join-Path $sourceRoot $item
  if (-not (Test-Path $sourcePath)) {
    continue
  }

  Copy-Item -Path $sourcePath -Destination $targetRoot -Recurse -Force
}

Write-Host "Seeded Ollama runtime from $sourceRoot to $targetRoot."
