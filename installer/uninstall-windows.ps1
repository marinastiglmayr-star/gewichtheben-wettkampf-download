$ErrorActionPreference = "Stop"

$appDir = $PSScriptRoot
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Gewichtheben Wettkampf"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Gewichtheben Wettkampf.lnk"

$answer = Read-Host "Gewichtheben Wettkampf wirklich deinstallieren? Daten werden geloescht. (ja/nein)"
if ($answer -ne "ja") {
  Write-Host "Abgebrochen."
  exit 0
}

if (Test-Path $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
}
if (Test-Path $startMenuDir) {
  Remove-Item -LiteralPath $startMenuDir -Recurse -Force
}

$encodedPath = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($appDir))
Start-Process -FilePath powershell.exe -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "`$path = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('$encodedPath')); Start-Sleep -Seconds 2; Remove-Item -LiteralPath `$path -Recurse -Force"
) -WindowStyle Hidden

Write-Host "Deinstallation gestartet."
