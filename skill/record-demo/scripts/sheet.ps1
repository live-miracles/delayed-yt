# Timestamped contact sheet of a take (or a PNG of single frames) for choosing build.ps1's cut times.
#   sheet.ps1 -Take setup -Step 2                 one tile per 2 s of setup.mkv
#   sheet.ps1 -Take setup -At 21.0,21.1,21.2      exact frames, e.g. the one where the dialog first draws
param([string]$Take = 'setup', [double]$Step = 2, [double[]]$At, [int]$Cols = 6)
. "$PSScriptRoot\config.ps1"
$in = Join-Path $Config.OutDir "$Take.mkv"
$out = Join-Path $Config.OutDir "sheet-$Take.png"
$label = "drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{pts\:hms}':fontcolor=yellow:fontsize=18:x=4:y=4:box=1:boxcolor=black@0.6"
if ($At) {
  $tiles = @()
  foreach ($t in $At) {
    $f = Join-Path $Config.OutDir ("frame-{0}.png" -f $t)
    ffmpeg -hide_banner -loglevel error -y -ss $t -i $in -frames:v 1 -vf "scale=480:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$t':fontcolor=red:fontsize=22:x=4:y=30:box=1:boxcolor=white@0.8" $f
    $tiles += $f
  }
  $inputs = $tiles | ForEach-Object { '-i'; $_ }
  ffmpeg -hide_banner -loglevel error -y @inputs -filter_complex "hstack=$($tiles.Count)" $out
} else {
  $dur = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 $in)
  $rows = [Math]::Ceiling($dur / $Step / $Cols)
  ffmpeg -hide_banner -loglevel error -y -i $in -vf "fps=1/$Step,scale=300:-1,$label,tile=${Cols}x$rows" -frames:v 1 $out
}
$out
