$ErrorActionPreference = "Stop"

$ruleName = "Gewichtheben Wettkampf App 8765"
$nodePath = "C:\Users\marin\AppData\Local\OpenAI\Codex\bin\node.exe"

# Windows has an old public-profile TCP block rule for this exact node.exe.
# Disable only that TCP block; keep the default firewall policy intact.
netsh advfirewall firewall set rule `
  name="node.exe" `
  dir=in `
  program="$nodePath" `
  profile=public `
  protocol=TCP `
  new enable=no | Out-Host

# Recreate the narrow allow rule for this app only.
netsh advfirewall firewall delete rule name="$ruleName" | Out-Null
netsh advfirewall firewall add rule `
  name="$ruleName" `
  dir=in `
  action=allow `
  protocol=TCP `
  localport=8765 `
  program="$nodePath" `
  profile=private,public `
  remoteip=192.168.178.0/24 | Out-Host

Write-Host "Fertig. Port 8765 ist fuer node.exe aus dem Heimnetz 192.168.178.0/24 erlaubt."
Start-Sleep -Seconds 3
