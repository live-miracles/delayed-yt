# Cuts setup.mkv and jump.mkv into demo.mp4 and demo.gif, hiding the vMix dialog's recent-files list.
# Times are seconds in the takes' own video time. Defaults match the original recording; find yours
# with sheet.ps1 (see SKILL.md, step 5).
#   -Publish  also copies the GIF and a still into the repo's assets/ folder
param(
  [double]$IntroStart  = 0.6,    # setup: first frame worth keeping (empty form)
  [double]$LoadStart   = 8.0,    # setup: Update clicked; player loading (played 2x)
  [double]$CopyStart   = 15.0,   # setup: URL copied, switch to vMix, Add Input clicked
  [double]$DialogFirst = 21.15,  # setup: first frame where the dialog's file list is drawn (mask starts here)
  [double]$TabSwitch   = 23.0,   # setup: dialog switches from Video tab to Web Browser tab
  [double]$DialogEnd   = 32.0,   # setup: first frame after the dialog closes (mask ends here)
  [double]$LoadEnd     = 44.0,   # setup: input loaded and showing the delay (loading played 4x until here)
  [double]$SetupEnd    = 46.5,   # setup: last frame kept
  [double]$JumpStart   = 3.2,    # jump: first frame kept
  [double]$JumpEnd     = 16.0,   # jump: last frame kept (after the readout recovered)
  [double]$StillAt     = 10.8,   # jump: frame for the full-size still (readout at its lowest)
  [switch]$Publish
)
. "$PSScriptRoot\config.ps1"
$out = $Config.OutDir; $m = $Config.Mask
$setup = Join-Path $out 'setup.mkv'; $jump = Join-Path $out 'jump.mkv'
foreach ($f in $setup, $jump) { if (-not (Test-Path $f)) { throw "Missing $f. Record the takes first." } }

function Box($b, $from, $to) { "drawbox=x=$($b.X):y=$($b.Y):w=$($b.W):h=$($b.H):color=white:t=fill:enable='between(t,$from,$to)'" }
$mask = (Box $m.VideoTab $DialogFirst $TabSwitch) + ',' + (Box $m.WebTab $TabSwitch $DialogEnd)

$fc = @"
[0:v]$mask,split=6[a1][a2][a3][a4][a5][a6];
[a1]trim=${IntroStart}:${LoadStart},setpts=PTS-STARTPTS[v1];
[a2]trim=${LoadStart}:${CopyStart},setpts=(PTS-STARTPTS)/2[v2];
[a3]trim=${CopyStart}:${TabSwitch},setpts=PTS-STARTPTS[v3];
[a4]trim=${TabSwitch}:${DialogEnd},setpts=(PTS-STARTPTS)/1.5[v4];
[a5]trim=${DialogEnd}:${LoadEnd},setpts=(PTS-STARTPTS)/4[v5];
[a6]trim=${LoadEnd}:${SetupEnd},setpts=PTS-STARTPTS[v6];
[1:v]trim=${JumpStart}:${JumpEnd},setpts=PTS-STARTPTS[v7];
[v1][v2][v3][v4][v5][v6][v7]concat=n=7:v=1:a=0,fps=$($Config.Fps),scale=960:-2:flags=lanczos,format=yuv420p[out]
"@
$mp4 = Join-Path $out 'demo.mp4'; $gif = Join-Path $out 'demo.gif'
ffmpeg -hide_banner -loglevel error -y -i $setup -i $jump -filter_complex $fc -map '[out]' -c:v libx264 -crf 20 -preset medium $mp4
ffmpeg -hide_banner -loglevel error -y -i $mp4 -vf 'fps=10,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle' $gif

$mb = [Math]::Round((Get-Item $gif).Length / 1MB, 2)
"demo.mp4 $([Math]::Round((Get-Item $mp4).Length / 1MB, 2)) MB, demo.gif $mb MB, $(ffprobe -v error -show_entries format=duration -of csv=p=0 $mp4) s"
if ($mb -gt 5) { Write-Warning 'GIF is over 5 MB: GitHub renders it slowly. Shorten the takes or speed up more of the loading.' }

# Contact sheet of the result, to review before publishing.
ffmpeg -hide_banner -loglevel error -y -i $mp4 -vf "fps=1/2,scale=320:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{pts\:hms}':fontcolor=yellow:fontsize=16:x=4:y=4:box=1:boxcolor=black@0.6,tile=6x4" -frames:v 1 (Join-Path $out 'sheet-demo.png')

if ($Publish) {
  $assets = Join-Path (Resolve-Path "$PSScriptRoot\..\..\..").Path 'assets'
  New-Item -ItemType Directory -Force $assets | Out-Null
  Copy-Item $gif (Join-Path $assets 'delayed-yt-vmix-demo.gif') -Force
  ffmpeg -hide_banner -loglevel error -y -ss $StillAt -i $jump -frames:v 1 -vf 'scale=1280:-1:flags=lanczos' (Join-Path $assets 'delayed-yt-vmix-live-jump.png')
  "Published to $assets"
}
