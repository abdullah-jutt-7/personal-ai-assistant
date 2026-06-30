$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$buildRoot = Join-Path $repoRoot "build\host"
$cacheRoot = Join-Path $repoRoot ".cache\webview2"
$packageIndexUrl = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/index.json"
$packageBaseUrl = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2"
$sourcePath = Join-Path $repoRoot "webview-host\IntelliText.Host.cs"

if (-not (Test-Path $sourcePath)) {
  throw "Missing host source at $sourcePath."
}

New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null

$index = Invoke-RestMethod -Uri $packageIndexUrl -TimeoutSec 30
$stableVersions = @($index.versions | Where-Object { $_ -notmatch '-' })
if (-not $stableVersions) {
  throw "Could not determine a stable Microsoft.Web.WebView2 package version."
}

$packageVersion = ($stableVersions | Sort-Object { [version]$_ } | Select-Object -Last 1)
$packageRoot = Join-Path $cacheRoot $packageVersion
$nupkgPath = Join-Path $cacheRoot "Microsoft.Web.WebView2.$packageVersion.nupkg"

if (-not (Test-Path $nupkgPath)) {
  $downloadUrl = "$packageBaseUrl/$packageVersion"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $nupkgPath -TimeoutSec 120
}

if (-not (Test-Path $packageRoot) -or -not (Get-ChildItem -LiteralPath $packageRoot -Recurse -Filter "*.dll" -ErrorAction SilentlyContinue)) {
  if (Test-Path $packageRoot) {
    Remove-Item -LiteralPath $packageRoot -Recurse -Force
  }
  $tempZipPath = Join-Path $cacheRoot "Microsoft.Web.WebView2.$packageVersion.zip"
  Copy-Item -Path $nupkgPath -Destination $tempZipPath -Force
  Expand-Archive -LiteralPath $tempZipPath -DestinationPath $packageRoot -Force
  Remove-Item -LiteralPath $tempZipPath -Force -ErrorAction SilentlyContinue
}

$coreDll = Get-ChildItem -LiteralPath $packageRoot -Recurse -Filter "Microsoft.Web.WebView2.Core.dll" | Select-Object -First 1
$winFormsDll = Get-ChildItem -LiteralPath $packageRoot -Recurse -Filter "Microsoft.Web.WebView2.WinForms.dll" | Select-Object -First 1
$loaderCandidates = @(
  (Join-Path $packageRoot "runtimes\win-x64\native\WebView2Loader.dll"),
  (Join-Path $packageRoot "build\native\x64\WebView2Loader.dll"),
  (Join-Path $packageRoot "runtimes\win-x86\native\WebView2Loader.dll"),
  (Join-Path $packageRoot "build\native\x86\WebView2Loader.dll")
)
$loaderDll = $loaderCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $coreDll -or -not $winFormsDll -or -not $loaderDll) {
  throw "Could not locate the required WebView2 assemblies in the downloaded package."
}

$frameworkDir = [System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()
$cscCandidates = @(
  (Join-Path ${env:WINDIR} "Microsoft.NET\Framework64\v4.0.30319\csc.exe"),
  (Join-Path ${env:WINDIR} "Microsoft.NET\Framework\v4.0.30319\csc.exe")
)
$cscExe = $cscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $cscExe) {
  throw "Could not find csc.exe. Install the .NET Framework build tools."
}

$outputExe = Join-Path $buildRoot "IntelliText.exe"
$referenceArgs = @(
  (Join-Path $frameworkDir "System.dll"),
  (Join-Path $frameworkDir "System.Core.dll"),
  (Join-Path $frameworkDir "System.Drawing.dll"),
  (Join-Path $frameworkDir "System.Net.Http.dll"),
  (Join-Path $frameworkDir "System.Windows.Forms.dll"),
  (Join-Path $frameworkDir "Microsoft.CSharp.dll"),
  $coreDll.FullName,
  $winFormsDll.FullName
)

$compileArgs = @(
  "/nologo",
  "/target:winexe",
  "/platform:x64",
  "/optimize+",
  "/out:$outputExe"
)

foreach ($reference in $referenceArgs) {
  $compileArgs += "/reference:$reference"
}

$compileArgs += $sourcePath

& $cscExe @compileArgs

Copy-Item -Path $coreDll.FullName -Destination $buildRoot -Force
Copy-Item -Path $winFormsDll.FullName -Destination $buildRoot -Force
Copy-Item -Path $loaderDll -Destination $buildRoot -Force

Write-Host "Built WebView2 host at $outputExe using Microsoft.Web.WebView2 $packageVersion"
