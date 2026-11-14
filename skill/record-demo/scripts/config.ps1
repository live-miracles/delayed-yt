# Everything specific to this machine, this vMix layout or this stream lives here.
# Re-calibrate the Points with shot.ps1 -Points whenever the display, DPI, vMix version
# or the site layout changes.

$Config = @{
  # Working files (takes, contact sheets, Chrome profile). Kept outside the repo.
  OutDir    = $(if ($env:DEMO_OUT) { $env:DEMO_OUT } else { Join-Path $env:TEMP 'delayed-yt-demo' })

  SiteUrl   = 'https://live-miracles.github.io/delayed-yt/'
  StreamUrl = 'https://www.youtube.com/watch?v=_bVZgcX55g0'

  # Optional CSS typed into vMix's CSS box (e.g. to enlarge the delay readout). Empty = record as-is.
  Css       = ''

  ChromeExe = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  VMixExe   = 'C:\Program Files (x86)\vMix\vMix64.exe'

  # Chrome and vMix are both placed here, so one capture region records either.
  Window    = @{ X = 100; Y = 60; W = 1500; H = 900 }
  # The visible part of that window (it has an invisible 8 px border) and the capture rate.
  Region    = @{ X = 108; Y = 61; W = 1484; H = 890 }
  Fps       = 15

  # Click targets in capture-region coordinates (origin = top-left of Region).
  Points    = @{
    VideoId       = @(550, 748)    # Chrome: Video ID field, after scrolling ScrollNotches down
    Update        = @(1040, 748)   # Chrome: Update button
    AddInput      = @(53, 853)     # vMix: Add Input button
    WebBrowserTab = @(384, 644)    # vMix Input Select: Web Browser
    UrlField      = @(997, 136)    # vMix Web Browser tab: URL
    CssField      = @(1100, 185)   # vMix Web Browser tab: CSS
    DialogOk      = @(1166, 734)   # vMix Input Select: OK
    InputHeader   = @(100, 573)    # vMix: input 1's title bar. Clicking it sends the input to Preview;
                                   #       clicking its thumbnail instead is forwarded to the page and pauses the video
    InputClose    = @(195, 573)    # vMix: X on input 1
    ConfirmYes    = @(826, 543)    # vMix: "Close input?" YES
    LivePill      = @(25, 429)     # vMix preview: YouTube "Live / -15:00" label (bottom-left)
    TimelineA     = @(150, 440)    # vMix preview: spots on YouTube's progress bar to click
    TimelineB     = @(330, 440)
    TimelineC     = @(520, 440)
    HoverA        = @(300, 230)    # vMix preview: spots to wander through before the first click
    HoverB        = @(240, 380)
  }
  # Chrome: wheel notches (100 px each) from the top. 5 puts the lower part of the player above the
  # form, so the video and the whole form are both on screen.
  ScrollNotches = 5

  # vMix Input Select dialog lists recent files and URLs. build.ps1 paints these boxes white
  # while the dialog is open so none of that shows. Capture-region coordinates.
  Mask      = @{
    VideoTab = @{ X = 512; Y = 203; W = 872; H = 462 }
    WebTab   = @{ X = 513; Y = 233; W = 867; H = 417 }
  }
}
