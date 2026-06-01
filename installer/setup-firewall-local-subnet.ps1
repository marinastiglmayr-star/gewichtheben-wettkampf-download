$ErrorActionPreference = "Stop"

$appDir = $PSScriptRoot
$nodePathFile = Join-Path $appDir "node-path.txt"
$nodePath = $null

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
  throw "Node.js wurde nicht gefunden."
}

$ruleName = "Gewichtheben Wettkampf LocalSubnet 8765"

netsh advfirewall firewall set rule `
  name="node.exe" `
  dir=in `
  program="$nodePath" `
  profile=public `
  protocol=TCP `
  new enable=no | Out-Host

netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

netsh advfirewall firewall add rule `
  name="$ruleName" `
  dir=in `
  action=allow `
  protocol=TCP `
  localport=8765 `
  program="$nodePath" `
  profile=private,public `
  remoteip=LocalSubnet | Out-Host

Write-Host ""
Write-Host "Firewall-Regel wurde eingerichtet:"
Write-Host "- TCP 8765"
Write-Host "- nur lokales Subnetz"
Write-Host "- Programm: $nodePath"
Start-Sleep -Seconds 3
