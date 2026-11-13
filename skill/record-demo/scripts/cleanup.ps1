# Closes the throw-away Chrome window prepare.ps1 opened. vMix is left running.
. "$PSScriptRoot\config.ps1"
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
  Where-Object { $_.CommandLine -match [regex]::Escape((Join-Path $Config.OutDir 'chrome-profile')) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host 'Closed the demo Chrome. vMix is still open: close its demo input (X, YES) or the whole app yourself.'
