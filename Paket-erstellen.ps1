$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root "dist"
$stage = Join-Path $dist "Gewichtheben-Wettkampf-App"
$zip = Join-Path $dist "Gewichtheben-Wettkampf-App.zip"

if (Test-Path $stage) {
  try {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction Stop
  } catch {
    Write-Warning "Der alte Paketordner ist noch von einem Prozess geoeffnet und wird in-place aktualisiert: $($_.Exception.Message)"
  }
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "installer") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "runtime") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "assets") -Force | Out-Null

$iconPath = Join-Path $root "assets\app-icon.ico"
if (-not (Test-Path $iconPath)) {
  & (Join-Path $root "tools\create-app-icon.ps1")
}

$versionFile = Join-Path $root "version.txt"
$buildVersion = Get-Date -Format "yyyy.M.d.HHmmss"
Set-Content -LiteralPath $versionFile -Value $buildVersion -Encoding UTF8

$rootFiles = @(
  "Installieren.cmd",
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
  "version.txt",
  "update-url.txt"
)

$installerFiles = @(
  "install-windows.ps1",
  "start-app.ps1",
  "setup-firewall-local-subnet.ps1",
  "uninstall-windows.ps1"
)

foreach ($file in $rootFiles) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $stage $file) -Force
}

foreach ($file in $installerFiles) {
  Copy-Item -LiteralPath (Join-Path $root "installer\$file") -Destination (Join-Path $stage "installer\$file") -Force
}

foreach ($asset in @("app-icon.ico", "app-icon.png", "wappen.png", "iwf-logo.svg")) {
  $assetSource = Join-Path $root "assets\$asset"
  if (Test-Path $assetSource) {
    Copy-Item -LiteralPath $assetSource -Destination (Join-Path $stage "assets\$asset") -Force
  }
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeCandidates = @()
$nodeCandidates += Join-Path $env:LOCALAPPDATA "GewichthebenWettkampf\runtime\node.exe"
if ($nodeCommand) {
  $nodeCandidates += $nodeCommand.Source
}
$nodeCandidates += Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin\node.exe"

$nodeSource = $nodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($nodeSource) {
  Copy-Item -LiteralPath $nodeSource -Destination (Join-Path $stage "runtime\node.exe") -Force
  Write-Host "Node-Laufzeit gebuendelt:"
  Write-Host $nodeSource
} else {
  Write-Warning "Node.js wurde nicht gefunden. Das Paket benoetigt dann Node.js auf dem Zielrechner."
}

if (Test-Path $zip) {
  Remove-Item -LiteralPath $zip -Force
}

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force

$version = (Get-Content -LiteralPath $versionFile -Raw).Trim()

$updateSite = Join-Path $dist "update-site"
if (Test-Path $updateSite) {
  Remove-Item -LiteralPath $updateSite -Recurse -Force
}
New-Item -ItemType Directory -Path $updateSite -Force | Out-Null

$updateZipName = "Gewichtheben-Wettkampf-App.zip"
$updateZip = Join-Path $updateSite $updateZipName
Copy-Item -LiteralPath $zip -Destination $updateZip -Force

New-Item -ItemType Directory -Path (Join-Path $updateSite "assets") -Force | Out-Null
foreach ($siteAsset in @("wappen.png", "app-icon.png")) {
  $siteAssetSource = Join-Path $root "assets\$siteAsset"
  if (Test-Path $siteAssetSource) {
    Copy-Item -LiteralPath $siteAssetSource -Destination (Join-Path $updateSite "assets\$siteAsset") -Force
  }
}

$sha256 = (Get-FileHash -LiteralPath $updateZip -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
  app = "Gewichtheben Wettkampf"
  version = $version
  packageUrl = $updateZipName
  sha256 = $sha256
  publishedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  notes = "Aktuelle Version der Gewichtheben-Wettkampfsoftware."
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $updateSite "update.json") -Encoding UTF8

$downloadPage = @"
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gewichtheben Wettkampf - Download</title>
    <style>
      :root {
        --bg: #eef4f6;
        --surface: #ffffff;
        --ink: #172026;
        --muted: #65737d;
        --line: #d5dde3;
        --accent: #087f8c;
        --accent-dark: #05616c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Segoe UI, Arial, sans-serif;
        background:
          linear-gradient(180deg, rgba(8, 127, 140, 0.14), transparent 300px),
          var(--bg);
        color: var(--ink);
      }
      main { width: min(1040px, 100%); margin: 0 auto; padding: 42px 20px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 28px; }
      .brand { display: flex; align-items: center; gap: 14px; }
      .logo { width: 68px; height: 68px; object-fit: contain; }
      .eyebrow { margin: 0 0 5px; color: var(--accent-dark); font-weight: 900; font-size: 0.82rem; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.6rem); line-height: 1; }
      .status { border: 1px solid var(--line); border-radius: 999px; padding: 10px 14px; background: rgba(255,255,255,0.76); color: var(--accent-dark); font-weight: 900; white-space: nowrap; }
      .grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr); gap: 18px; align-items: start; }
      .card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 26px; box-shadow: 0 18px 38px rgba(23, 33, 40, 0.08); }
      h2 { margin: 0 0 8px; font-size: 1.45rem; }
      p { margin: 0; color: var(--muted); font-size: 1.04rem; line-height: 1.5; }
      .version { margin-top: 20px; font-size: clamp(2.2rem, 10vw, 4.2rem); line-height: 0.95; font-weight: 950; letter-spacing: 0; }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        margin-top: 22px;
        padding: 13px 18px;
        border-radius: 7px;
        background: var(--accent);
        color: #fff;
        font-weight: 900;
        text-decoration: none;
      }
      .button:hover { background: var(--accent-dark); }
      .meta { display: grid; gap: 12px; margin-top: 18px; }
      .row { display: grid; gap: 6px; padding-top: 12px; border-top: 1px solid var(--line); }
      .label { color: #4e5d68; font-size: 0.78rem; font-weight: 900; text-transform: uppercase; }
      code {
        display: block;
        max-width: 100%;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #eef3f5;
        color: #16222b;
        overflow: auto;
        white-space: nowrap;
      }
      @media (max-width: 780px) {
        header { align-items: flex-start; flex-direction: column; }
        .grid { grid-template-columns: 1fr; }
        .status { white-space: normal; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="brand">
          <img class="logo" src="assets/wappen.png" alt="STC Bavaria 20 Landshut e. V." />
          <div>
            <p class="eyebrow">STC Bavaria 20 Landshut e. V.</p>
            <h1>Gewichtheben Wettkampf</h1>
          </div>
        </div>
        <div class="status">Aktuelle Version online</div>
      </header>

      <section class="grid">
        <div class="card">
          <p class="eyebrow">Download</p>
          <h2>Installationspaket fuer Vereins-Laptops</h2>
          <p>Diese Seite stellt die aktuelle Installationsdatei und das Update-Manifest fuer die automatische Aktualisierung bereit.</p>
          <div class="version">$version</div>
          <a class="button" href="$updateZipName">Installationspaket herunterladen</a>
        </div>

        <div class="card">
          <p class="eyebrow">Auto-Update</p>
          <h2>Update-Adresse</h2>
          <p>Diese Adresse wird in der Software als Update-Quelle eingetragen.</p>
          <div class="meta">
            <div class="row">
              <span class="label">Manifest</span>
              <code id="manifest-url">update.json</code>
            </div>
            <div class="row">
              <span class="label">SHA-256</span>
              <code>$sha256</code>
            </div>
          </div>
        </div>
      </section>
    </main>
    <script>
      const manifestTarget = document.getElementById("manifest-url");
      if (manifestTarget) {
        manifestTarget.textContent = new URL("update.json", window.location.href).href;
      }
    </script>
  </body>
</html>
"@
$downloadPage | Set-Content -LiteralPath (Join-Path $updateSite "index.html") -Encoding UTF8

Write-Host "Installationspaket erstellt:"
Write-Host $zip
Write-Host "Update-Seite erstellt:"
Write-Host $updateSite
