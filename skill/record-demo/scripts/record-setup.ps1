# Take 1 (setup.mkv): paste the stream link in Chrome, click Update, copy the page URL,
# switch to vMix and add a Web Browser input with that URL. Marks go to setup.log.
# The recording keeps running after the script ends (default 80 s) so the input's loading is captured;
# build.ps1 trims it.
param([int]$Seconds = 80)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
$P = $Config.Points; $s = Get-State
$chrome = [IntPtr]$s.chromeHwnd; $vmix = [IntPtr]$s.vmixHwnd

Assert-Foreground $chrome
Start-Capture 'setup' $Seconds
Start-Sleep -Milliseconds 1200

CClick $P.VideoId 500
Assert-Foreground $chrome
Key-Combo @($VK.Ctrl, $VK.V) 1400              # paste: the page extracts the video ID
Mark 'pasted'
CClick $P.Update 7500                          # player loads, stats show the delay
Mark 'updated'
Assert-Foreground $chrome
Key-Combo @($VK.Ctrl, $VK.L) 500
Key-Combo @($VK.Ctrl, $VK.C) 1800              # copy the address-bar URL, left highlighted
Mark 'copied'
Key-Combo @($VK.Esc) 300

Focus-Window $vmix
Start-Sleep -Milliseconds 900
Mark 'vmix'
CClick $P.AddInput 1800
Mark 'dialog_open'                             # the dialog first draws ~0.3 s after the click
Assert-ForegroundPid $s.vmixPid
CClick $P.WebBrowserTab 900
CClick $P.UrlField 300
Key-Combo @($VK.Ctrl, $VK.A) 100
Key-Combo @($VK.Ctrl, $VK.V) 1200              # the copied page URL
if ($Config.Css) {
  Set-Clipboard $Config.Css
  CClick $P.CssField 300
  Key-Combo @($VK.Ctrl, $VK.V) 1400
}
Mark 'filled'
CClick $P.DialogOk 200
Mark 'ok'
Save-Marks 'setup'
