$ErrorActionPreference = "Stop"

$sourceRoot = Split-Path -Parent $PSScriptRoot
$installDir = Join-Path $env:LOCALAPPDATA "GewichthebenWettkampf"
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Gewichtheben Wettkampf"
$desktopDir = [Environment]::GetFolderPath("Desktop")

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

function Find-SystemNode {
  $candidates = @()
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($command) {
    $candidates += $command.Source
  }
  $candidates += Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin\node.exe"

  foreach ($candidate in $candidates | Select-Object -Unique) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  throw "Node.js wurde nicht gefunden. Bitte Node.js LTS installieren oder die App aus Codex heraus starten."
}

function Test-SamePath {
  param(
    [string]$Left,
    [string]$Right
  )

  if (-not $Left -or -not $Right) {
    return $false
  }

  try {
    return [System.IO.Path]::GetFullPath($Left).TrimEnd("\") -ieq [System.IO.Path]::GetFullPath($Right).TrimEnd("\")
  } catch {
    return $Left -ieq $Right
  }
}

function Stop-InstalledAppServer {
  $runtimeNode = Join-Path $installDir "runtime\node.exe"
  $stoppedAny = $false

  foreach ($process in Get-Process -Name node -ErrorAction SilentlyContinue) {
    $processPath = $null
    try {
      $processPath = $process.Path
    } catch {
      $processPath = $null
    }

    if (-not (Test-SamePath $processPath $runtimeNode)) {
      continue
    }

    if (-not $stoppedAny) {
      Write-Host "Laufender Gewichtheben-Server wird fuer das Update beendet."
      $stoppedAny = $true
    }

    try {
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
      Wait-Process -Id $process.Id -Timeout 5 -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "Prozess $($process.Id) konnte nicht automatisch beendet werden: $($_.Exception.Message)"
    }
  }
}

function New-AppShortcut {
  param(
    [string]$Path,
    [string]$ScriptPath,
    [string]$WorkingDirectory,
    [string]$IconPath
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = "powershell.exe"
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
  $shortcut.WorkingDirectory = $WorkingDirectory
  if ($IconPath -and (Test-Path $IconPath)) {
    $shortcut.IconLocation = $IconPath
  } else {
    $shortcut.IconLocation = "powershell.exe,0"
  }
  $shortcut.Save()
}

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $installDir "assets") -Force | Out-Null

Stop-InstalledAppServer

foreach ($file in $appFiles) {
  Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination (Join-Path $installDir $file) -Force
}

$updateUrlSource = Join-Path $sourceRoot "update-url.txt"
$updateUrlTarget = Join-Path $installDir "update-url.txt"
$targetUpdateUrl = ""
if (Test-Path $updateUrlTarget) {
  $targetUpdateUrl = (Get-Content -LiteralPath $updateUrlTarget -Raw -ErrorAction SilentlyContinue).Trim()
}
if ((Test-Path $updateUrlSource) -and (-not (Test-Path $updateUrlTarget) -or -not $targetUpdateUrl)) {
  Copy-Item -LiteralPath $updateUrlSource -Destination $updateUrlTarget -Force
}

$currentUpdateUrl = ""
if (Test-Path $updateUrlTarget) {
  $currentUpdateUrl = (Get-Content -LiteralPath $updateUrlTarget -Raw -ErrorAction SilentlyContinue).Trim()
}
Write-Host ""
Write-Host "Online-Updates:"
if ($currentUpdateUrl) {
  Write-Host "Aktuelle Update-Adresse:"
  Write-Host $currentUpdateUrl
  $enteredUpdateUrl = Read-Host "Neue Update-Adresse eingeben oder Enter druecken, um sie beizubehalten"
} else {
  $enteredUpdateUrl = Read-Host "Update-Adresse zur update.json eingeben oder Enter druecken, um Online-Updates vorerst zu deaktivieren"
}
if ($enteredUpdateUrl.Trim()) {
  Set-Content -LiteralPath $updateUrlTarget -Value $enteredUpdateUrl.Trim() -Encoding UTF8
}

foreach ($file in $scriptFiles) {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $installDir $file) -Force
}

foreach ($asset in @("app-icon.ico", "app-icon.png", "wappen.png", "iwf-logo.svg")) {
  $assetSource = Join-Path $sourceRoot "assets\$asset"
  if (Test-Path $assetSource) {
    Copy-Item -LiteralPath $assetSource -Destination (Join-Path $installDir "assets\$asset") -Force
  }
}

$bundledNodeSource = Join-Path $sourceRoot "runtime\node.exe"
$bundledNodeTarget = Join-Path $installDir "runtime\node.exe"
if (Test-Path $bundledNodeSource) {
  New-Item -ItemType Directory -Path (Join-Path $installDir "runtime") -Force | Out-Null
  try {
    Copy-Item -LiteralPath $bundledNodeSource -Destination $bundledNodeTarget -Force -ErrorAction Stop
  } catch {
    if (-not (Test-Path $bundledNodeTarget)) {
      throw
    }
    Write-Warning "Die vorhandene Node-Laufzeit konnte nicht ueberschrieben werden und wird weiter benutzt. Details: $($_.Exception.Message)"
  }
  $nodePath = $bundledNodeTarget
} elseif (Test-Path $bundledNodeTarget) {
  $nodePath = $bundledNodeTarget
} else {
  $nodePath = Find-SystemNode
}

$statePath = Join-Path $installDir "competition-state.json"
if (-not (Test-Path $statePath)) {
  @'
{
  "meta": {
    "eventName": "",
    "category": "",
    "group": "A",
    "mode": "setup",
    "activeLift": "snatch",
    "activeGroupId": null,
    "refereeCount": 3,
    "scoringMode": "CLUB",
    "childTechniqueEnabled": false,
    "sequence": 0,
    "breakPending": false,
    "startedAt": null,
    "liveVotes": { "key": null, "votes": [null, null, null] },
    "liveTechnique": { "key": null, "points": [null, null, null] },
    "judgeConnections": { "solo": null, "left": null, "center": null, "right": null }
  },
  "groups": [
    { "id": "group-a", "name": "A", "order": 1, "completed": false }
  ],
  "relativeTables": {},
  "athletes": []
}
'@ | Set-Content -LiteralPath $statePath -Encoding UTF8
}

Set-Content -LiteralPath (Join-Path $installDir "node-path.txt") -Value $nodePath -Encoding UTF8

$startScript = Join-Path $installDir "start-app.ps1"
$uninstallScript = Join-Path $installDir "uninstall-windows.ps1"
$iconPath = Join-Path $installDir "assets\app-icon.ico"

New-AppShortcut -Path (Join-Path $desktopDir "Gewichtheben Wettkampf.lnk") -ScriptPath $startScript -WorkingDirectory $installDir -IconPath $iconPath
New-AppShortcut -Path (Join-Path $startMenuDir "Gewichtheben Wettkampf.lnk") -ScriptPath $startScript -WorkingDirectory $installDir -IconPath $iconPath
New-AppShortcut -Path (Join-Path $startMenuDir "Gewichtheben Wettkampf deinstallieren.lnk") -ScriptPath $uninstallScript -WorkingDirectory $installDir -IconPath $iconPath

Write-Host "Installiert nach:"
Write-Host $installDir
Write-Host ""
Write-Host "Node.js:"
Write-Host $nodePath
Write-Host ""
Write-Host "Verknuepfungen wurden auf dem Desktop und im Startmenue erstellt."
Write-Host ""

Write-Host "Die Firewall-Regel fuer Handys im aktuellen lokalen Netz wird jetzt eingerichtet."
Write-Host "Windows zeigt dafuer gleich eine Administrator-Abfrage."
try {
  $firewallScript = Join-Path $installDir "setup-firewall-local-subnet.ps1"
  Start-Process -FilePath powershell.exe -Verb RunAs -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $firewallScript
  ) -Wait
} catch {
  Write-Warning "Firewall-Regel konnte nicht automatisch eingerichtet werden. Starte das Skript setup-firewall-local-subnet.ps1 spaeter als Administrator."
}

$launch = Read-Host "App jetzt starten? (j/n)"
if ($launch -match "^(j|J|y|Y)") {
  & $startScript
}
