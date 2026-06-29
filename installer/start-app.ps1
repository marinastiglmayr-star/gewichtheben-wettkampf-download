$ErrorActionPreference = "Stop"

$appDir = $PSScriptRoot
$nodePathFile = Join-Path $appDir "node-path.txt"
$versionFile = Join-Path $appDir "version.txt"
$updateUrlFile = Join-Path $appDir "update-url.txt"
$nodePath = $null
$launcherLog = Join-Path $appDir "launcher.log"
$launcherUi = @{
  Enabled = $false
  Form = $null
  Progress = $null
  Status = $null
  Detail = $null
}

function Write-LauncherLog {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $launcherLog -Encoding UTF8 -Value "[$stamp] $Message"
}

function Initialize-LauncherUi {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Gewichtheben Wettkampf"
    $form.Width = 540
    $form.Height = 230
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true
    $form.BackColor = [System.Drawing.Color]::FromArgb(242, 246, 248)

    $title = New-Object System.Windows.Forms.Label
    $title.Text = "Gewichtheben Wettkampf"
    $title.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $title.AutoSize = $true
    $title.Location = New-Object System.Drawing.Point(22, 18)

    $status = New-Object System.Windows.Forms.Label
    $status.Text = "Pruefe auf Updates..."
    $status.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $status.AutoSize = $false
    $status.Width = 490
    $status.Height = 24
    $status.Location = New-Object System.Drawing.Point(24, 62)

    $progress = New-Object System.Windows.Forms.ProgressBar
    $progress.Minimum = 0
    $progress.Maximum = 100
    $progress.Value = 0
    $progress.Style = "Marquee"
    $progress.Width = 490
    $progress.Height = 26
    $progress.Location = New-Object System.Drawing.Point(24, 96)

    $detail = New-Object System.Windows.Forms.Label
    $detail.Text = "Bitte warten."
    $detail.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $detail.AutoSize = $false
    $detail.Width = 490
    $detail.Height = 48
    $detail.Location = New-Object System.Drawing.Point(24, 134)

    $form.Controls.Add($title)
    $form.Controls.Add($status)
    $form.Controls.Add($progress)
    $form.Controls.Add($detail)
    $form.Show()
    [System.Windows.Forms.Application]::DoEvents()

    $script:launcherUi.Enabled = $true
    $script:launcherUi.Form = $form
    $script:launcherUi.Progress = $progress
    $script:launcherUi.Status = $status
    $script:launcherUi.Detail = $detail
  } catch {
    $script:launcherUi.Enabled = $false
    Write-LauncherLog "Launcher-Fenster konnte nicht erstellt werden: $($_.Exception.Message)"
  }
}

function Set-LauncherUi {
  param(
    [string]$Status,
    [int]$Percent = -1,
    [string]$Detail = "",
    [switch]$Indeterminate
  )

  if (-not $script:launcherUi.Enabled) {
    return
  }

  try {
    if ($Status) {
      $script:launcherUi.Status.Text = $Status
    }
    if ($Detail) {
      $script:launcherUi.Detail.Text = $Detail
    }
    if ($Indeterminate -or $Percent -lt 0) {
      $script:launcherUi.Progress.Style = "Marquee"
    } else {
      $script:launcherUi.Progress.Style = "Continuous"
      $script:launcherUi.Progress.Value = [Math]::Min(100, [Math]::Max(0, $Percent))
    }
    [System.Windows.Forms.Application]::DoEvents()
  } catch {
    Write-LauncherLog "Launcher-Fenster konnte nicht aktualisiert werden: $($_.Exception.Message)"
  }
}

function Close-LauncherUi {
  if (-not $script:launcherUi.Enabled) {
    return
  }

  try {
    [System.Windows.Forms.Application]::DoEvents()
    $script:launcherUi.Form.Close()
    $script:launcherUi.Form.Dispose()
  } catch {}

  $script:launcherUi.Enabled = $false
}

function Format-TransferSize {
  param([double]$Bytes)

  if ($Bytes -ge 1GB) {
    return ("{0:N2} GB" -f ($Bytes / 1GB))
  }
  if ($Bytes -ge 1MB) {
    return ("{0:N2} MB" -f ($Bytes / 1MB))
  }
  if ($Bytes -ge 1KB) {
    return ("{0:N1} KB" -f ($Bytes / 1KB))
  }
  return ("{0:N0} B" -f $Bytes)
}

function Invoke-DownloadWithProgress {
  param(
    [string]$Uri,
    [string]$OutFile
  )

  $request = [System.Net.HttpWebRequest]::Create($Uri)
  $request.Method = "GET"
  $request.UserAgent = "GewichthebenWettkampfLauncher/1.0"
  $request.Timeout = 30000
  $request.ReadWriteTimeout = 30000
  $response = $request.GetResponse()
  $totalBytes = [double]$response.ContentLength
  $inputStream = $response.GetResponseStream()
  $outputStream = [System.IO.File]::Create($OutFile)
  $buffer = New-Object byte[] 1048576
  $downloaded = [double]0
  $lastBytes = [double]0
  $lastTime = Get-Date

  try {
    while ($true) {
      $read = $inputStream.Read($buffer, 0, $buffer.Length)
      if ($read -le 0) {
        break
      }

      $outputStream.Write($buffer, 0, $read)
      $downloaded += $read
      $now = Get-Date
      $elapsed = ($now - $lastTime).TotalSeconds
      if ($elapsed -ge 0.25 -or ($totalBytes -gt 0 -and $downloaded -ge $totalBytes)) {
        $speed = if ($elapsed -gt 0) { ($downloaded - $lastBytes) / $elapsed } else { 0 }
        $percent = if ($totalBytes -gt 0) { [int][Math]::Floor(($downloaded / $totalBytes) * 100) } else { -1 }
        $totalLabel = if ($totalBytes -gt 0) { Format-TransferSize $totalBytes } else { "unbekannt" }
        $percentLabel = if ($percent -ge 0) { "$percent%" } else { "laeuft" }
        Set-LauncherUi -Status "Update wird heruntergeladen..." -Percent $percent -Detail "$percentLabel - $(Format-TransferSize $downloaded) von $totalLabel - $(Format-TransferSize $speed)/s"
        $lastBytes = $downloaded
        $lastTime = $now
      }
    }
  } finally {
    $outputStream.Close()
    $inputStream.Close()
    $response.Close()
  }
}

function Show-AppMessage {
  param([string]$Message)
  try {
    $shell = New-Object -ComObject WScript.Shell
    $shell.Popup($Message, 0, "Gewichtheben Wettkampf", 48) | Out-Null
  } catch {
    Write-Host $Message
  }
}

function Get-InstalledVersion {
  if (Test-Path $versionFile) {
    return (Get-Content -LiteralPath $versionFile -Raw -ErrorAction SilentlyContinue).Trim()
  }
  return "0.0.0.0"
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

function Test-NewerVersion {
  param(
    [string]$Current,
    [string]$Latest
  )

  if (-not $Latest) {
    return $false
  }

  try {
    return ([version]$Latest) -gt ([version]$Current)
  } catch {
    return $Latest -ne $Current
  }
}

function Resolve-UpdateUrl {
  param(
    [string]$ManifestUrl,
    [string]$Value
  )

  if (-not $Value) {
    return $null
  }

  try {
    return ([Uri]::new([Uri]$ManifestUrl, $Value)).AbsoluteUri
  } catch {
    return $Value
  }
}

function Stop-AppServerForUpdate {
  $serverScript = Join-Path $appDir "server.js"
  $runtimeNode = Join-Path $appDir "runtime\node.exe"
  $stoppedAny = $false

  try {
    $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop
    foreach ($process in $nodeProcesses) {
      $commandLine = [string]$process.CommandLine
      if ($commandLine -and $commandLine.Contains($serverScript)) {
        if (-not $stoppedAny) {
          Write-LauncherLog "Laufender Server wird fuer Update beendet."
          $stoppedAny = $true
        }
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    foreach ($process in Get-Process -Name node -ErrorAction SilentlyContinue) {
      $processPath = $null
      try {
        $processPath = $process.Path
      } catch {
        $processPath = $null
      }
      if (Test-SamePath $processPath $runtimeNode) {
        if (-not $stoppedAny) {
          Write-LauncherLog "Laufender Server wird fuer Update beendet."
          $stoppedAny = $true
        }
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      }
    }
  }

  if ($stoppedAny) {
    Start-Sleep -Milliseconds 600
  }
}

function Copy-UpdatedFiles {
  param([string]$SourceRoot)

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

  foreach ($file in $appFiles) {
    $source = Join-Path $SourceRoot $file
    if (Test-Path $source) {
      Copy-Item -LiteralPath $source -Destination (Join-Path $appDir $file) -Force
    }
  }

  $installerSource = Join-Path $SourceRoot "installer"
  if (Test-Path $installerSource) {
    foreach ($file in @("start-app.ps1", "setup-firewall-local-subnet.ps1", "uninstall-windows.ps1")) {
      $source = Join-Path $installerSource $file
      if (Test-Path $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $appDir $file) -Force
      }
    }
  }

  $assetSource = Join-Path $SourceRoot "assets"
  if (Test-Path $assetSource) {
    New-Item -ItemType Directory -Path (Join-Path $appDir "assets") -Force | Out-Null
    foreach ($asset in @("app-icon.ico", "app-icon.png", "wappen.png", "iwf-logo.svg")) {
      $source = Join-Path $assetSource $asset
      if (Test-Path $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $appDir "assets\$asset") -Force
      }
    }
  }

  $runtimeDir = Join-Path $appDir "runtime"
  foreach ($runtimeFile in @("node.exe", "ffmpeg.exe")) {
    $runtimeSource = Join-Path $SourceRoot "runtime\$runtimeFile"
    if (Test-Path $runtimeSource) {
      New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
      Copy-Item -LiteralPath $runtimeSource -Destination (Join-Path $runtimeDir $runtimeFile) -Force
    }
  }
}

function Invoke-AutoUpdate {
  if (-not (Test-Path $updateUrlFile)) {
    Write-LauncherLog "Keine Update-Adresse eingerichtet."
    return
  }

  $manifestUrl = (Get-Content -LiteralPath $updateUrlFile -Raw -ErrorAction SilentlyContinue).Trim()
  if (-not $manifestUrl) {
    Write-LauncherLog "Update-Pruefung uebersprungen: update-url.txt ist leer."
    return
  }

  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  } catch {}

  Initialize-LauncherUi
  Set-LauncherUi -Status "Pruefe auf neue Version..." -Detail $manifestUrl -Indeterminate

  try {
    Write-LauncherLog "Update-Pruefung: $manifestUrl"
    $manifest = Invoke-RestMethod -UseBasicParsing -Uri $manifestUrl -TimeoutSec 8
    $currentVersion = Get-InstalledVersion
    $latestVersion = [string]$manifest.version

    if (-not (Test-NewerVersion -Current $currentVersion -Latest $latestVersion)) {
      Write-LauncherLog "Keine neue Version. Installiert: $currentVersion, aktuell: $latestVersion"
      Set-LauncherUi -Status "Software ist aktuell." -Percent 100 -Detail "Installiert: $currentVersion"
      Start-Sleep -Milliseconds 450
      return
    }

    $packageUrl = Resolve-UpdateUrl -ManifestUrl $manifestUrl -Value ([string]$manifest.packageUrl)
    if (-not $packageUrl) {
      throw "Update-Manifest enthaelt keine packageUrl."
    }

    Set-LauncherUi -Status "Neue Version gefunden." -Percent 0 -Detail "Installiert: $currentVersion`nNeu: $latestVersion"
    Start-Sleep -Milliseconds 600
    Write-LauncherLog "Update wird geladen: Version $latestVersion von $packageUrl"

    $tempRoot = Join-Path $env:TEMP ("GewichthebenWettkampfUpdate-" + [guid]::NewGuid().ToString("N"))
    $zipPath = Join-Path $tempRoot "update.zip"
    $extractPath = Join-Path $tempRoot "extract"
    New-Item -ItemType Directory -Path $tempRoot, $extractPath -Force | Out-Null

    Invoke-DownloadWithProgress -Uri $packageUrl -OutFile $zipPath

    if ($manifest.sha256) {
      Set-LauncherUi -Status "Download wird geprueft..." -Percent 100 -Detail "Pruefsumme wird verglichen."
      $actualHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
      $expectedHash = ([string]$manifest.sha256).Trim().ToLowerInvariant()
      if ($actualHash -ne $expectedHash) {
        throw "Update-Pruefsumme stimmt nicht. Erwartet $expectedHash, erhalten $actualHash."
      }
    }

    Set-LauncherUi -Status "Update wird entpackt..." -Percent 92 -Detail "Installationspaket wird vorbereitet."
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
    $sourceRoot = $extractPath
    if (-not (Test-Path (Join-Path $sourceRoot "server.js"))) {
      $candidate = Get-ChildItem -LiteralPath $extractPath -Directory | Where-Object {
        Test-Path (Join-Path $_.FullName "server.js")
      } | Select-Object -First 1
      if ($candidate) {
        $sourceRoot = $candidate.FullName
      }
    }

    if (-not (Test-Path (Join-Path $sourceRoot "server.js"))) {
      throw "Update-Paket enthaelt keine gueltige App-Struktur."
    }

    Set-LauncherUi -Status "Update wird installiert..." -Percent 96 -Detail "Programmdateien werden aktualisiert."
    Stop-AppServerForUpdate
    Copy-UpdatedFiles -SourceRoot $sourceRoot
    Write-LauncherLog "Update auf Version $latestVersion installiert."
    Set-LauncherUi -Status "Update abgeschlossen." -Percent 100 -Detail "Version $latestVersion wurde installiert."
    Start-Sleep -Milliseconds 700

    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  } catch {
    Write-LauncherLog "Update-Pruefung fehlgeschlagen: $($_.Exception.Message)"
    Set-LauncherUi -Status "Update-Pruefung fehlgeschlagen." -Percent 100 -Detail $_.Exception.Message
    Start-Sleep -Milliseconds 900
    Show-AppMessage "Die automatische Update-Pruefung ist fehlgeschlagen. Die installierte Version wird gestartet.`n`n$($_.Exception.Message)"
  } finally {
    Close-LauncherUi
  }
}

Write-LauncherLog "Startskript gestartet."
Invoke-AutoUpdate

if (Test-Path $nodePathFile) {
  $nodePath = (Get-Content -LiteralPath $nodePathFile -Raw).Trim()
}

if (-not $nodePath -or -not (Test-Path $nodePath)) {
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($command) {
    $nodePath = $command.Source
  }
}

if (-not $nodePath -or -not (Test-Path $nodePath)) {
  Write-LauncherLog "Node.js wurde nicht gefunden."
  Show-AppMessage "Node.js wurde nicht gefunden. Bitte Node.js LTS installieren oder die App neu installieren."
  exit 1
}

Write-LauncherLog "Node.js: $nodePath"

function Test-AppServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8765/api/session" -TimeoutSec 1
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-AppServer)) {
  $stdout = Join-Path $appDir "server.log"
  $stderr = Join-Path $appDir "server.err"
  Remove-Item -LiteralPath $stdout, $stderr -Force -ErrorAction SilentlyContinue

  $serverScript = Join-Path $appDir "server.js"
  Write-LauncherLog "Server wird gestartet: $serverScript"
  try {
    $commandLine = "`"`"$nodePath`" `"$serverScript`" 1> `"$stdout`" 2> `"$stderr`"`""
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = "/d /s /c $commandLine"
    $startInfo.WorkingDirectory = $appDir
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $process = [System.Diagnostics.Process]::Start($startInfo)
    Write-LauncherLog "Serverprozess gestartet, PID $($process.Id)."
  } catch {
    Write-LauncherLog "Serverprozess konnte nicht gestartet werden: $($_.Exception.Message)"
    Show-AppMessage "Der lokale Server konnte nicht gestartet werden.`n`n$($_.Exception.Message)"
    exit 1
  }

  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    if (Test-AppServer) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    $details = "Der lokale Server konnte nicht gestartet werden.`n`n"
    $details += "Logdateien:`n$launcherLog`n$stdout`n$stderr`n`n"
    if (Test-Path $stderr) {
      $errorText = (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue).Trim()
      if ($errorText) {
        $details += "Fehler:`n$errorText"
      }
    }
    Write-LauncherLog "Server wurde nicht rechtzeitig bereit."
    Show-AppMessage $details
    exit 1
  }
}

try {
  Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8765/api/session/rotate" -Method Post -TimeoutSec 2 | Out-Null
  Write-LauncherLog "Verbindungscode wurde erneuert."
} catch {
  Write-LauncherLog "Verbindungscode konnte nicht erneuert werden: $($_.Exception.Message)"
  # The app can still run; this only refreshes the judge login code for a new program start.
}

Write-LauncherLog "Browser wird geöffnet."
Start-Process "http://127.0.0.1:8765"
