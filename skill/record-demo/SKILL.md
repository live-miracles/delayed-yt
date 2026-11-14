---
name: record-demo
description: Re-record the README demo GIF (vMix browser input, YouTube timeline clicks). Use when the GIF no longer matches the site after a UI change, the stream is stale, or the user asks to redo, refresh or re-record the demo.
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
   Done when `shot.ps1 -Name prep` shows Chrome with the lower part of the player above the form, and vMix with two Blank inputs.
2. **Calibrate** only if the display, DPI, vMix version or site layout changed. Run `shot.ps1 -Name calib -Points` with each window in front.
   Done when every red box in the screenshot sits on its target; otherwise fix `Config.Points`. The vMix dialog targets need a dry run with the dialog open.
3. **Record setup.** Run `record-setup.ps1`, then wait for the vMix input to load.
   Done when `setup.log` has a mark through `ok` and a `shot.ps1` screenshot shows the vMix monitors playing at the configured delay with no ad.
   During an ad, wait; clicking inside the preview opens the ad's link and the input navigates away. Recover by redoing step 1 with `-CloseVMixInput`.
4. **Record the jumps.** Run `record-jump.ps1`. It clicks several spots on YouTube's timeline.
   Done when `sheet.ps1 -Take jump -Step 2` shows the stream landing on a different scene after most clicks and returning to the original scene about a second later. A click on the LIVE label alone can leave the picture unchanged: the stream is already within seconds of live, and the delay is restored in under a second.
5. **Build.** Run `sheet.ps1 -Take setup -Step 2` and set the cut times in `build.ps1`'s parameters from the sheet, then run `build.ps1`. Jump cuts come from `jump.log` automatically.
   Done when all hold in the `sheet.ps1 -At` frames and the GIF itself (`ffmpeg -i demo.gif`): the Input Select dialog's file list is white in every frame (no paths, no URLs); no white box floats over vMix after the dialog closes; each jump is visible in slow motion and the return follows it; the GIF is under 5 MB.
   Find the exact edge frames with `sheet.ps1 -Take setup -At <times 0.07 s apart>`: the mask starts on the first frame the dialog is drawn and ends on the last frame it is on screen.
6. **Publish.** Run `build.ps1 -Publish` (add `-StillAt <jump.mkv seconds>` for a still just after a jump), then `cleanup.ps1`.
   Done when `git status` shows only the two assets (and `README.md` if its text changed). Check the README alt text still describes the beats on screen.

## Reference

- **Foreground.** Every script asserts the target window is in front before sending keys. A stale handle once sent keystrokes into the Claude app. When an assert aborts, re-run `prepare.ps1`; never remove the asserts.
- **Window order.** Windows are placed non-topmost on purpose: a topmost window hides vMix's Input Select dialog, which is its own window.
- **Fresh Chrome profile.** `prepare.ps1` uses a throw-away profile so no account, bookmark or extension can appear on screen. Close it afterwards with `cleanup.ps1`.
- **Dialog privacy.** vMix's Input Select dialog lists recent files and URLs, first on the Video tab and then on the Web Browser tab. `build.ps1` paints both lists white; they never appear in the GIF.
- **Input size.** Keep vMix's default 1920×1080 for the input. Smaller sizes render letterboxed, and 640×360 left the YouTube ad frozen.
- **Readout size.** The page's delay readout is about 4 px in vMix's monitors, so the jumps are shown through the picture changing instead. `Config.Css` can enlarge the readout through vMix's CSS box (for example `#delay-info{font-size:56px !important;opacity:1 !important}`); it is empty by default and the README does not mention it. Add a README note if you set it.
- **Selecting the input.** Click the input's title bar (`Points.InputHeader`) to send it to Preview. Clicking its thumbnail is forwarded to the page and pauses the video.
- **Timeline clicks.** Hover about 1 s before clicking so YouTube's controls are showing; an earlier click toggles pause instead. A timeline jump takes up to 1.7 s to come back, so `build.ps1` plays about two seconds around each click at 0.6x.
- **Readout drift.** After each jump the delay settles a few seconds higher (`15m 1s`, `15m 6s`, `15m 12s`); this is the script's own correction.
- **Third-party content.** The recording shows the chosen stream's artwork. Keep the README note that its content belongs to its channel.
- **Size budget.** Keep the GIF under 5 MB; GitHub renders larger ones slowly. `build.ps1` defaults to 10 fps, 800 px, 96 colours (4.6 MB for 42 s). Cut idle waits, drop a jump or speed up the loading before lowering quality further.
