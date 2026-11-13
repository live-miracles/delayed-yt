# Everything specific to this machine, this vMix layout or this stream lives here.
# Re-calibrate the Points with shot.ps1 -Points whenever the display, DPI, vMix version
# or the site layout changes.

$Config = @{
  # Working files (takes, contact sheets, Chrome profile). Kept outside the repo.
  OutDir    = $(if ($env:DEMO_OUT) { $env:DEMO_OUT } else { Join-Path $env:TEMP 'delayed-yt-demo' })

  SiteUrl   = 'https://live-miracles.github.io/delayed-yt/'
  StreamUrl = 'https://www.youtube.com/watch?v=_bVZgcX55g0'

  # Optional CSS typed into vMix's CSS box so the delay readout is legible in a GIF.
  Css       = '#delay-info{font-size:56px !important;opacity:1 !important}'

  ChromeExe = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  VMixExe   = 'C:\Program Files (x86)\vMix\vMix64.exe'

  # Chrome and vMix are both placed here, so one capture region records either.
  Window    = @{ X = 100; Y = 60; W = 1500; H = 900 }
  # The visible part of that window (it has an invisible 8 px border) and the capture rate.
  Region    = @{ X = 108; Y = 61; W = 1484; H = 890 }
  Fps       = 15

  # Click targets in capture-region coordinates (origin = top-left of Region).
  Points    = @{
    VideoId       = @(550, 408)    # Chrome: Video ID field, after scrolling ScrollNotches down
    Update        = @(1040, 408)   # Chrome: Update button
    AddInput      = @(53, 853)     # vMix: Add Input button
    WebBrowserTab = @(384, 644)    # vMix Input Select: Web Browser
    UrlField      = @(997, 136)    # vMix Web Browser tab: URL
    CssField      = @(1100, 185)   # vMix Web Browser tab: CSS
    DialogOk      = @(1166, 734)   # vMix Input Select: OK
    InputClose    = @(195, 477)    # vMix: X on input 1
    ConfirmYes    = @(826, 447)    # vMix: "Close input?" YES
    LivePill      = @(106, 343)    # vMix preview: YouTube "Live / -15:00" pill (bottom-left)
    HoverA        = @(300, 230)    # vMix preview: spots to wander through before the click
    HoverB        = @(220, 320)
  }
  ScrollNotches = 8                # Chrome: wheel notches from the top to bring the form into view

  # vMix Input Select dialog lists recent files and URLs. build.ps1 paints these boxes white
  # while the dialog is open so none of that shows. Capture-region coordinates.
  Mask      = @{
    VideoTab = @{ X = 512; Y = 203; W = 872; H = 462 }
    WebTab   = @{ X = 513; Y = 233; W = 867; H = 417 }
  }
}
