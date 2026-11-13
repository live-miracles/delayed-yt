---
name: record-demo
description: Re-record the README demo GIF (vMix browser input, YouTube LIVE click). Use when the GIF no longer matches the site after a UI change, the stream is stale, or the user asks to redo, refresh or re-record the demo.
---

# Re-record the demo

Produces `assets/delayed-yt-vmix-demo.gif` and `assets/delayed-yt-vmix-live-jump.png`, shown at the top of `README.md`.

Windows only: PowerShell 5.1, `ffmpeg` on PATH, vMix 64-bit, Chrome. The scripts in `scripts/` drive the **real** mouse and keyboard and record a screen region. Machine- and layout-specific values (URLs, click targets, window geometry) all live in `scripts/config.ps1`.

## Before the first script

1. Ask the user to leave the mouse and keyboard alone for about 5 minutes, and wait for the yes. Input sent while they type lands in their windows.
2. Confirm the site shows the UI you want to record. The demo runs against the public URL, so deploy first and check `gh run list` and the page's `Last-Modified`.
3. Choose the stream in `Config.StreamUrl`. It passes when, in a browser on the public site, Duration and Delay show real values within 10 s and no ad plays. A stream without DVR stays at `???`; an ad-supported stream such as Lofi Girl plays minutes of pre-rolls.

## Steps

Each script is `scripts/<name>.ps1`. Set `$env:DEMO_OUT` to move the working folder (default `%TEMP%\delayed-yt-demo`).

1. **Prepare.** Run `prepare.ps1` (add `-CloseVMixInput` if a demo input is still in vMix).
   Done when `shot.ps1 -Name prep` shows Chrome's empty form in view and vMix with two Blank inputs.
2. **Calibrate** only if the display, DPI, vMix version or site layout changed. Run `shot.ps1 -Name calib -Points` with each window in front.
   Done when every red box in the screenshot sits on its target; otherwise fix `Config.Points`.
3. **Record setup.** Run `record-setup.ps1`, then wait for the vMix input to load.
   Done when `setup.log` has a mark through `ok` and a `shot.ps1` screenshot shows the vMix monitors with the readout at the configured delay and no ad.
   During an ad, wait; clicking inside the preview opens the ad's link and the input navigates away. Recover by redoing step 1 with `-CloseVMixInput`.
4. **Record the jump.** Run `record-jump.ps1`.
   Done when frames from `sheet.ps1 -Take jump -At <times>` show the readout dropping to about `1s` and returning to the delay. Video time runs about 2 s ahead of the `jump.log` marks, so start at `click1` + 2 s and step by 0.3 s.
5. **Build.** Run `sheet.ps1 -Take setup -Step 2`, set the cut times in `build.ps1`'s parameters from the sheet, then run `build.ps1`.
   Done when all hold in `sheet-demo.png` and in full-size frames: the Input Select dialog's file list is blank white in every frame (no paths, no URLs), the drop and the recovery are visible, and the GIF is under 5 MB.
   Find the first dialog frame with `sheet.ps1 -Take setup -At 21.0,21.1,21.2`: the mask starts on the first frame whose list is drawn.
6. **Publish.** Run `build.ps1 -Publish` with the same parameters, then `cleanup.ps1`.
   Done when `git status` shows only the two assets (and `README.md` if its text changed). Check the README alt text still describes the beats on screen.

## Reference

- **Foreground.** Every script asserts the target window is in front before sending keys. A stale handle once sent keystrokes into the Claude app. When an assert aborts, re-run `prepare.ps1`; never remove the asserts.
- **Window order.** Windows are placed non-topmost on purpose: a topmost window hides vMix's Input Select dialog, which is its own window.
- **Fresh Chrome profile.** `prepare.ps1` uses a throw-away profile so no account, bookmark or extension can appear on screen. Close it afterwards with `cleanup.ps1`.
- **Dialog privacy.** vMix's Input Select dialog lists recent files and URLs, first on the Video tab and then on the Web Browser tab. `build.ps1` paints both lists white; they never appear in the GIF.
- **Input size.** Keep vMix's default 1920×1080 for the input. Smaller sizes render letterboxed, and 640×360 left the YouTube ad frozen.
- **Readout size.** The page's delay readout is about 4 px in vMix's monitors. `Config.Css` enlarges it through vMix's CSS box; the README says so. Set it to an empty string to record without it.
- **LIVE pill.** It is the small "Live / -15:00" pill at the bottom-left of the preview, about 10 px wide. Hover and wait about 1 s for the controls before clicking; an earlier click toggles pause instead.
- **Readout drift.** After each jump the delay settles a few seconds higher (`15m 1s`, `15m 6s`, `15m 12s`); this is the script's own correction.
- **Third-party content.** The recording shows the chosen stream's artwork. Keep the README note that its content belongs to its channel.
- **Size budget.** Keep the GIF under 5 MB at 960 px wide; GitHub renders larger ones slowly. Cut idle waits and speed up the loading in `build.ps1` first.
