# Starts vMix and a fresh-profile Chrome, places both at Config.Window, resets them to the
# starting state and writes their window handles to OutDir\state.json.
#   -CloseVMixInput  also closes input 1 in vMix (use when a previous demo input is still there)
param([switch]$CloseVMixInput)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
New-Item -ItemType Directory -Force $Config.OutDir | Out-Null

function Wait-Window($getProc, [string]$label) {
  for ($i = 0; $i -lt 40; $i++) {
    $p = & $getProc
    if ($p -and $p.MainWindowHandle -ne 0) { return $p }
    Start-Sleep -Milliseconds 500
  }
  throw "$label did not open a window within 20 s."
}

# vMix (reuse the running one)
if (-not (Get-Process vMix64 -ErrorAction SilentlyContinue)) { Start-Process $Config.VMixExe | Out-Null }
$vmix = Wait-Window { Get-Process vMix64 -ErrorAction SilentlyContinue | Select-Object -First 1 } 'vMix'

# Chrome with a throw-away profile: no accounts, bookmarks or extensions can show up on screen.
$profile = Join-Path $Config.OutDir 'chrome-profile'
Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue
$chrome = Start-Process $Config.ChromeExe -PassThru -ArgumentList "--user-data-dir=`"$profile`"", '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--new-window', $Config.SiteUrl
$chrome = Wait-Window { $chrome.Refresh(); $chrome } 'Chrome'

@{ vmixPid = $vmix.Id; vmixHwnd = [int64]$vmix.MainWindowHandle; chromePid = $chrome.Id; chromeHwnd = [int64]$chrome.MainWindowHandle } |
  ConvertTo-Json | Set-Content $StatePath
$state = Get-State

if ($CloseVMixInput) {
  Focus-Window ([IntPtr]$state.vmixHwnd)
  CClick $Config.Points.InputClose 900
  CClick $Config.Points.ConfirmYes 1500
}

# Chrome: clean page, form scrolled into view, stream link on the clipboard ready to paste.
Focus-Window ([IntPtr]$state.chromeHwnd)
Key-Combo @($VK.Ctrl, $VK.L) 300
Set-Clipboard $Config.SiteUrl
Key-Combo @($VK.Ctrl, $VK.V) 300
Key-Combo @($VK.Enter) 3500
Move-To 800 500 300
Scroll-By -20 500
Scroll-By $Config.ScrollNotches 1000
Set-Clipboard $Config.StreamUrl

Get-Content $StatePath -Raw
Write-Host "Check with: shot.ps1 -Name prep   (Chrome: empty form in view. vMix: two Blank inputs.)"
