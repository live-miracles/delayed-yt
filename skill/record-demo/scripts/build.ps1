# Cuts setup.mkv and jump.mkv into demo.mp4 and demo.gif, hiding the vMix dialog's recent-files list
# and slowing each jump down so it can be seen (the script pulls the player back in well under a second).
# Times are seconds in the takes' own video time. Defaults match the latest recording; find yours
# with sheet.ps1 (see SKILL.md, step 5).
#   -Publish  also copies the GIF and a still into the repo's assets/ folder
param(
  # setup.mkv
  [double]$IntroStart  = 0.6,    # first frame worth keeping (empty form)
  [double]$LoadStart   = 6.0,    # Update clicked; player loading
  [double]$CopyStart   = 14.0,   # URL copied, switch to vMix
  [double]$DialogFirst = 18.25,  # first frame where the dialog is drawn (mask starts here; its file list follows 0.1 s later)
  [double]$TabSwitch   = 20.55,  # dialog now shows the Web Browser tab (the Video-tab list is still drawn until just before)
  [double]$DialogEnd   = 24.85,  # last frame with the dialog on screen (mask ends here; a later end leaves a white box floating over vMix)
  [double]$LoadEnd     = 28.5,   # input loaded and playing (loading is sped up until here)
  [double]$SetupEnd    = 31.0,   # last frame kept
  [double]$SpeedIntro  = 1.5,    # pasting the link and clicking Update
  [double]$SpeedLoad   = 2,      # player loading and URL copy
  [double]$SpeedDialog = 2,      # filling vMix's dialog
  [double]$SpeedWait   = 3,      # waiting for the vMix input to load
  # jump.mkv (cut from jump.log: click marks + JumpOffset = the moment each jump shows on screen)
  [double]$JumpStart   = 3.0,    # first frame kept
  [double]$JumpOffset  = 2.7,    # video time of a jump = its click mark + this
  [double]$SlowBefore  = 0.4,    # slow motion starts this long before the jump...
  [double]$SlowAfter   = 1.9,    # ...and ends this long after it (a timeline jump lasts up to ~1.7 s)
  [double]$SlowSpeed   = 0.6,    # playback speed inside that window
  [double]$SpeedBetween = 2,     # playback speed between jumps
  [double]$TailLength  = 1.5,    # seconds kept after the last slow-motion window
  [double]$StillAt     = -1,     # jump.mkv time for the full-size still; -1 = just after the 2nd jump
  [string]$JumpCrop    = '700:420:0:60',   # w:h:x:y crop on the vMix preview (zoom ~1.4x); '' = no zoom
  # GIF encoding: 10 fps, 800 px, 96 colours kept the 42 s clip at 4.6 MB (960 px, 128 colours was 6.4 MB)
  [int]$GifFps         = 10,
  [int]$GifWidth       = 800,
  [int]$GifColors      = 96,
  [switch]$Publish
)
. "$PSScriptRoot\config.ps1"
$out = $Config.OutDir; $m = $Config.Mask
$setup = Join-Path $out 'setup.mkv'; $jump = Join-Path $out 'jump.mkv'; $log = Join-Path $out 'jump.log'
foreach ($f in $setup, $jump, $log) { if (-not (Test-Path $f)) { throw "Missing $f. Record the takes first." } }

function Box($b, $from, $to) { "drawbox=x=$($b.X):y=$($b.Y):w=$($b.W):h=$($b.H):color=white:t=fill:enable='between(t,$from,$to)'" }
$mask = (Box $m.VideoTab $DialogFirst $TabSwitch) + ',' + (Box $m.WebTab $TabSwitch $DialogEnd)
$norm = 'scale=960:576:flags=lanczos'                       # every segment ends up 960x576 so they concat
$jumpVf = if ($JumpCrop) { "crop=$JumpCrop,$norm" } else { $norm }
function T($x) { ([double]$x).ToString([Globalization.CultureInfo]::InvariantCulture) }

# Jump segments: fast between jumps, slow motion around each one.
$clicks = Get-Content $log | Where-Object { $_ -match '^click' } | ForEach-Object { [double](($_ -split '=')[1]) + $JumpOffset }
if (-not $clicks) { throw "No click marks in $log." }
$segs = @(); $cursor = $JumpStart
foreach ($c in $clicks) {
  $a = [Math]::Max($cursor, $c - $SlowBefore); $b = $c + $SlowAfter
  if ($a - $cursor -gt 0.15) { $segs += , @($cursor, $a, $SpeedBetween) }
  $segs += , @($a, $b, $SlowSpeed); $cursor = $b
}
$segs += , @($cursor, $cursor + $TailLength, 1)
$splitLabels = (0..($segs.Count - 1) | ForEach-Object { "[j$_]" }) -join ''
$jumpChains = (0..($segs.Count - 1) | ForEach-Object {
    $s = $segs[$_]; "[j$_]trim=$(T $s[0]):$(T $s[1]),setpts=(PTS-STARTPTS)/$(T $s[2]),$jumpVf[w$_]"
  }) -join ";`n"
$wLabels = (0..($segs.Count - 1) | ForEach-Object { "[w$_]" }) -join ''

$fc = @"
[0:v]$mask,split=6[a1][a2][a3][a4][a5][a6];
[a1]trim=${IntroStart}:${LoadStart},setpts=(PTS-STARTPTS)/$SpeedIntro,$norm[v1];
[a2]trim=${LoadStart}:${CopyStart},setpts=(PTS-STARTPTS)/$SpeedLoad,$norm[v2];
[a3]trim=${CopyStart}:${TabSwitch},setpts=(PTS-STARTPTS)/$SpeedDialog,$norm[v3];
[a4]trim=${TabSwitch}:${DialogEnd},setpts=(PTS-STARTPTS)/$SpeedDialog,$norm[v4];
[a5]trim=${DialogEnd}:${LoadEnd},setpts=(PTS-STARTPTS)/$SpeedWait,$norm[v5];
[a6]trim=${LoadEnd}:${SetupEnd},setpts=PTS-STARTPTS,$norm[v6];
[1:v]split=$($segs.Count)$splitLabels;
$jumpChains;
[v1][v2][v3][v4][v5][v6]${wLabels}concat=n=$(6 + $segs.Count):v=1:a=0,fps=$($Config.Fps),format=yuv420p[out]
"@
$mp4 = Join-Path $out 'demo.mp4'; $gif = Join-Path $out 'demo.gif'
ffmpeg -hide_banner -loglevel error -y -i $setup -i $jump -filter_complex $fc -map '[out]' -c:v libx264 -crf 20 -preset medium $mp4
ffmpeg -hide_banner -loglevel error -y -i $mp4 -vf "fps=$GifFps,scale=${GifWidth}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${GifColors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" $gif

$mb = [Math]::Round((Get-Item $gif).Length / 1MB, 2)
"demo.mp4 $([Math]::Round((Get-Item $mp4).Length / 1MB, 2)) MB, demo.gif $mb MB, $(ffprobe -v error -show_entries format=duration -of csv=p=0 $mp4) s; jumps at $(($clicks | ForEach-Object { [Math]::Round($_, 1) }) -join ', ') s in jump.mkv"
if ($mb -gt 5) { Write-Warning 'GIF is over 5 MB: GitHub renders it slowly. Shorten the takes, drop a jump or speed up more of the loading.' }

# Contact sheet of the result, to review before publishing.
ffmpeg -hide_banner -loglevel error -y -i $mp4 -vf "fps=1/2,scale=320:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{pts\:hms}':fontcolor=yellow:fontsize=16:x=4:y=4:box=1:boxcolor=black@0.6,tile=6x6" -frames:v 1 (Join-Path $out 'sheet-demo.png')

if ($Publish) {
  $assets = Join-Path (Resolve-Path "$PSScriptRoot\..\..\..").Path 'assets'
  New-Item -ItemType Directory -Force $assets | Out-Null
  Copy-Item $gif (Join-Path $assets 'delayed-yt-vmix-demo.gif') -Force
  if ($StillAt -lt 0) { $StillAt = $clicks[[Math]::Min(1, $clicks.Count - 1)] + 0.2 }
  $stillVf = if ($JumpCrop) { "crop=$JumpCrop,scale=1280:-1:flags=lanczos" } else { 'scale=1280:-1:flags=lanczos' }
  ffmpeg -hide_banner -loglevel error -y -ss $StillAt -i $jump -frames:v 1 -vf $stillVf (Join-Path $assets 'delayed-yt-vmix-live-jump.png')
  "Published to $assets"
}
