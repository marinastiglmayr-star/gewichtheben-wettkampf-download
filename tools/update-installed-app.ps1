$ErrorActionPreference = "Stop"

$sourceRoot = Split-Path -Parent $PSScriptRoot
$installDir = Join-Path $env:LOCALAPPDATA "GewichthebenWettkampf"
$localAppData = [System.IO.Path]::GetFullPath($env:LOCALAPPDATA)
$installFull = [System.IO.Path]::GetFullPath($installDir)

if (-not $installFull.StartsWith($localAppData, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Installationspfad liegt nicht in LOCALAPPDATA."
}

$appFiles = @(
  "server.js",
  "index.html",
  "styles.css",
  "app.js",
  "judge.html",
  "judge.css",
  "judge.js",
  "tablet.html",
  "tablet.css",
  "tablet.js",
  "weigh.html",
  "weigh.css",
  "weigh.js",
  "plates.html",
  "plates.css",
  "plates.js",
  "scoreboard.html",
  "scoreboard.css",
  "scoreboard.js",
  "warteraum-display.html",
  "warteraum-display.css",
  "warteraum-display.js",
  "README.md",
  "version.txt"
)

$scriptFiles = @(
  "start-app.ps1",
  "setup-firewall-local-subnet.ps1",
  "uninstall-windows.ps1"
)

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $installDir "assets") -Force | Out-Null

$serverPath = Join-Path $installDir "server.js"
foreach ($process in Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue) {
  if ($process.CommandLine -like "*$serverPath*") {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

foreach ($file in $appFiles) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination (Join-Path $installDir $file) -Force
}

foreach ($file in $scriptFiles) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot "installer\$file") -Destination (Join-Path $installDir $file) -Force
}

foreach ($asset in @("app-icon.ico", "app-icon.png", "wappen.png", "iwf-logo.svg")) {
  $assetSource = Join-Path $sourceRoot "assets\$asset"
  if (Test-Path $assetSource) {
    Copy-Item -LiteralPath $assetSource -Destination (Join-Path $installDir "assets\$asset") -Force
  }
}

Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  (Join-Path $installDir "start-app.ps1")
) -WorkingDirectory $installDir

Write-Host "Installierte App aktualisiert und gestartet."
