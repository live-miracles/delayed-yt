# Helpers that drive the REAL mouse and keyboard. Dot-source after config.ps1.
# Every key press goes to whichever window has focus, so call Assert-Foreground first.

Add-Type -AssemblyName System.Windows.Forms
if (-not ('Win' -as [type])) {
  Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class Win {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte sc, uint f, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int w, int hh, uint f);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
}
"@
}

$VK = @{ Ctrl = 0x11; A = 0x41; C = 0x43; V = 0x56; L = 0x4C; Enter = 0x0D; Esc = 0x1B; Alt = 0x12 }
$StatePath = Join-Path $Config.OutDir 'state.json'

function Get-State { Get-Content $StatePath -Raw | ConvertFrom-Json }

# --- foreground guards -------------------------------------------------------
function Get-ForegroundTitle {
  $sb = New-Object Text.StringBuilder 256
  [Win]::GetWindowText([Win]::GetForegroundWindow(), $sb, 256) | Out-Null
  $sb.ToString()
}
function Assert-Foreground([IntPtr]$hwnd) {
  if (-not [Win]::IsWindow($hwnd)) { throw "ABORT: window $hwnd no longer exists. Re-run prepare.ps1." }
  if ([Win]::GetForegroundWindow() -ne $hwnd) { throw "ABORT: foreground is [$(Get-ForegroundTitle)], not the target window." }
}
# Dialogs (vMix Input Select) are their own windows, so match on the owning process instead.
function Assert-ForegroundPid([uint32]$procId) {
  $p = [uint32]0; [Win]::GetWindowThreadProcessId([Win]::GetForegroundWindow(), [ref]$p) | Out-Null
  if ($p -ne $procId) { throw "ABORT: foreground is [$(Get-ForegroundTitle)] (pid $p), expected pid $procId." }
}

# Places the window at Config.Window (non-topmost: a topmost window hides vMix's dialogs) and focuses it.
function Focus-Window([IntPtr]$hwnd) {
  $w = $Config.Window
  [Win]::ShowWindow($hwnd, 9) | Out-Null
  [Win]::SetWindowPos($hwnd, [IntPtr](-2), $w.X, $w.Y, $w.W, $w.H, 0x0040) | Out-Null
  [Win]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [Win]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)  # Alt tap lets SetForegroundWindow succeed
  [Win]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Milliseconds 700
  Assert-Foreground $hwnd
}

# --- mouse and keyboard ------------------------------------------------------
function Move-To([int]$x, [int]$y, [int]$ms = 600) {   # screen coordinates, eased glide
  $p = New-Object Win+POINT; [Win]::GetCursorPos([ref]$p) | Out-Null
  $steps = [Math]::Max(8, [int]($ms / 15))
  for ($i = 1; $i -le $steps; $i++) {
    $t = $i / $steps; $t = $t * $t * (3 - 2 * $t)
    [Win]::SetCursorPos([int]($p.X + ($x - $p.X) * $t), [int]($p.Y + ($y - $p.Y) * $t)) | Out-Null
    Start-Sleep -Milliseconds 15
  }
}
function Click-At([int]$x, [int]$y, [int]$wait = 900) {
  Move-To $x $y
  Start-Sleep -Milliseconds 150
  [Win]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 70
  [Win]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds $wait
}
# Capture-region variants: take a point such as $Config.Points.AddInput.
function CMove([int[]]$pt, [int]$ms = 600)     { Move-To ($pt[0] + $Config.Region.X) ($pt[1] + $Config.Region.Y) $ms }
function CClick([int[]]$pt, [int]$wait = 900)  { Click-At ($pt[0] + $Config.Region.X) ($pt[1] + $Config.Region.Y) $wait }

function Key-Combo([byte[]]$keys, [int]$wait = 400) {
  foreach ($k in $keys) { [Win]::keybd_event($k, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
  [array]::Reverse($keys)
  foreach ($k in $keys) { [Win]::keybd_event($k, 0, 2, [UIntPtr]::Zero); Start-Sleep -Milliseconds 30 }
  Start-Sleep -Milliseconds $wait
}
function Type-Text([string]$text, [int]$wait = 300) { [System.Windows.Forms.SendKeys]::SendWait($text); Start-Sleep -Milliseconds $wait }
function Scroll-By([int]$notches, [int]$wait = 600) {   # positive = down
  $delta = if ($notches -gt 0) { [uint32]4294967176 } else { [uint32]120 }   # -120 / +120 as unsigned
  for ($i = 0; $i -lt [Math]::Abs($notches); $i++) { [Win]::mouse_event(0x800, 0, 0, $delta, [UIntPtr]::Zero); Start-Sleep -Milliseconds 40 }
  Start-Sleep -Milliseconds $wait
}

# --- capture -----------------------------------------------------------------
function Start-Capture([string]$name, [int]$seconds) {
  $r = $Config.Region; $out = Join-Path $Config.OutDir "$name.mkv"
  Remove-Item $out -ErrorAction SilentlyContinue
  $args_ = "-hide_banner -loglevel error -y -f gdigrab -framerate $($Config.Fps) -draw_mouse 1 -offset_x $($r.X) -offset_y $($r.Y) -video_size $($r.W)x$($r.H) -i desktop -t $seconds -c:v libx264 -preset ultrafast -crf 16 -pix_fmt yuv420p `"$out`""
  $script:Capture = Start-Process ffmpeg -PassThru -WindowStyle Hidden -ArgumentList $args_
  Start-Sleep -Milliseconds 1500                     # ffmpeg start-up; marks are relative to after this
  $script:Clock = [Diagnostics.Stopwatch]::StartNew()
  $script:Marks = @()
  Mark 'start'
}
function Mark([string]$label) { $script:Marks += "$label=$([Math]::Round($script:Clock.Elapsed.TotalSeconds, 2))" }
function Save-Marks([string]$name) { $script:Marks -join "`n" | Set-Content (Join-Path $Config.OutDir "$name.log"); $script:Marks -join ' ' }

function Shot([string]$name, [switch]$Points) {     # one PNG of the capture region
  $r = $Config.Region; $out = Join-Path $Config.OutDir "$name.png"
  $vf = 'null'
  if ($Points) { $vf = (($Config.Points.Values | ForEach-Object { "drawbox=x=$($_[0] - 6):y=$($_[1] - 6):w=12:h=12:color=red:t=2" }) -join ',') }
  ffmpeg -hide_banner -loglevel error -y -f gdigrab -framerate 1 -offset_x $r.X -offset_y $r.Y -video_size "$($r.W)x$($r.H)" -i desktop -frames:v 1 -vf $vf $out
  $out
}
