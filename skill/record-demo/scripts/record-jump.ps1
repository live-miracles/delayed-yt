# Take 2 (jump.mkv): in the vMix preview, hover to reveal YouTube's controls and click the
# LIVE pill; the page's readout drops to ~0 and is seeked back to the delay. Marks go to jump.log.
# Run it only once the vMix input is playing at the configured delay with no ad on screen.
param([int]$Seconds = 24)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
$P = $Config.Points; $s = Get-State
$vmix = [IntPtr]$s.vmixHwnd

Assert-Foreground $vmix
CMove @(700, 420) 300
Start-Capture 'jump' $Seconds
Start-Sleep -Milliseconds 1500

Assert-Foreground $vmix
CMove $P.HoverA 700
Start-Sleep -Milliseconds 700
CMove $P.HoverB 500
Start-Sleep -Milliseconds 900
CMove $P.LivePill 600
Start-Sleep -Milliseconds 1500                 # controls need ~1 s to appear; clicking earlier toggles pause instead
Mark 'click1'
CClick $P.LivePill 50
Start-Sleep -Milliseconds 5500                 # drop, correction, settle
CMove $P.HoverA 500
Start-Sleep -Milliseconds 800
CMove $P.LivePill 500
Start-Sleep -Milliseconds 800
Mark 'click2'
CClick $P.LivePill 50
Start-Sleep -Milliseconds 5000
Mark 'end'
Save-Marks 'jump'
