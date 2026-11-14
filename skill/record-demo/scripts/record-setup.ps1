# Take 1 (setup.mkv): paste the stream link in Chrome, click Update, copy the page URL,
# switch to vMix and add a Web Browser input with that URL. Marks go to setup.log.
# The recording keeps running after the script ends (default 80 s) so the input's loading is captured;
# build.ps1 trims it.
param([int]$Seconds = 80)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
$P = $Config.Points; $s = Get-State
$chrome = [IntPtr]$s.chromeHwnd; $vmix = [IntPtr]$s.vmixHwnd
$Glide = 350                                   # brisk cursor: pasting and filling a form is not the interesting part

Assert-Foreground $chrome
Start-Capture 'setup' $Seconds
Start-Sleep -Milliseconds 800

CClick $P.VideoId 300
Assert-Foreground $chrome
Key-Combo @($VK.Ctrl, $VK.V) 900              # paste: the page extracts the video ID
Mark 'pasted'
CClick $P.Update 7000                          # player loads above the form, stats show the delay
Mark 'updated'
Assert-Foreground $chrome
Key-Combo @($VK.Ctrl, $VK.L) 400
Key-Combo @($VK.Ctrl, $VK.C) 1500              # copy the address-bar URL, left highlighted
Mark 'copied'
Key-Combo @($VK.Esc) 200

Focus-Window $vmix
Start-Sleep -Milliseconds 500
Mark 'vmix'
CClick $P.AddInput 2300                        # the first dialog of a vMix session can take 2 s to draw
Mark 'dialog_open'
Assert-ForegroundPid $s.vmixPid
CClick $P.WebBrowserTab 600
CClick $P.UrlField 200
Key-Combo @($VK.Ctrl, $VK.A) 100
Key-Combo @($VK.Ctrl, $VK.V) 900               # the copied page URL
if ($Config.Css) {
  Set-Clipboard $Config.Css
  CClick $P.CssField 200
  Key-Combo @($VK.Ctrl, $VK.V) 1000
}
Mark 'filled'
CClick $P.DialogOk 200
Mark 'ok'
Save-Marks 'setup'
