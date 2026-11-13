# One PNG of the capture region (what the recording will see). Read it to check window state.
#   shot.ps1 -Name prep
#   shot.ps1 -Name calib -Points    also draws a red box on every Config.Points target
param([string]$Name = 'shot', [switch]$Points)
. "$PSScriptRoot\config.ps1"; . "$PSScriptRoot\lib.ps1"
New-Item -ItemType Directory -Force $Config.OutDir | Out-Null
if ($Points) { Shot $Name -Points } else { Shot $Name }
