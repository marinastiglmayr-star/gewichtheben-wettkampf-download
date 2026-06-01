$ErrorActionPreference = "Stop"

$ruleName = "Gewichtheben Wettkampf Heimnetz Port 8765"

netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

netsh advfirewall firewall add rule `
  name="$ruleName" `
  dir=in `
  action=allow `
  protocol=TCP `
  localport=8765 `
  profile=private,public `
  remoteip=192.168.178.0/24 | Out-Host

Write-Host "Firewall-Regel wurde angelegt: $ruleName"
Write-Host "Erlaubt: TCP 8765 eingehend aus 192.168.178.0/24"
Start-Sleep -Seconds 3
