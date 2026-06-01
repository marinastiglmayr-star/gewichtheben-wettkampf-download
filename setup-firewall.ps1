$ErrorActionPreference = "Stop"

$ruleName = "Gewichtheben Wettkampf App 8765"
$nodePath = "C:\Users\marin\AppData\Local\OpenAI\Codex\bin\node.exe"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Remove-NetFirewallRule -DisplayName $ruleName
}

New-NetFirewallRule `
  -DisplayName $ruleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 8765 `
  -Program $nodePath `
  -Profile Public,Private `
  -RemoteAddress LocalSubnet | Out-Null

Write-Host "Firewall-Regel wurde angelegt: $ruleName"
Start-Sleep -Seconds 2
