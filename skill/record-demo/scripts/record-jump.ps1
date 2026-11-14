# Take 2 (jump.mkv): in the vMix preview, hover to reveal YouTube's controls, then knock the
# stream off its delay several times (clicks at different spots on the timeline, and the LIVE pill).
# After each click the script moves the player back; the gap between clicks lets that be seen.
# Marks go to jump.log. Run it only once the vMix input is playing at the configured delay, no ad on screen.
param([int]$Seconds = 40)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
$P = $Config.Points; $s = Get-State
$vmix = [IntPtr]$s.vmixHwnd

Assert-Foreground $vmix
CClick $P.InputHeader 800                      # off camera: send the input to Preview (the header; its thumbnail would pause it)
CMove @(740, 520) 300
Start-Capture 'jump' $Seconds
Start-Sleep -Milliseconds 1200

Assert-Foreground $vmix
CMove $P.HoverA 700
Start-Sleep -Milliseconds 600
CMove $P.HoverB 500
Start-Sleep -Milliseconds 700

# Each target: glide there, wait for the controls (clicking before they show toggles pause), click, watch the recovery.
$targets = @(
  @('timelineA', $P.TimelineA),
  @('live',      $P.LivePill),
  @('timelineB', $P.TimelineB),
  @('timelineC', $P.TimelineC)
)
$n = 0
foreach ($t in $targets) {
  $n++
  Assert-Foreground $vmix
  CMove $t[1] 600
  Start-Sleep -Milliseconds 1000
  Mark "click$n-$($t[0])"
  CClick $t[1] 50
  Start-Sleep -Milliseconds 3300
}
Mark 'end'
Save-Marks 'jump'
