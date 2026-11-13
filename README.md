# Delayed YouTube

[![Delayed YouTube in vMix. In Chrome, a YouTube live link is pasted into the Video ID field, the starting delay stays at 15 minutes, and Update loads the player. The page URL is copied and added in vMix as a Web Browser input. Clicking YouTube's LIVE button in the vMix preview jumps the readout to the live edge, and Delayed YouTube seeks back to the 15 minute delay within a second.](assets/delayed-yt-vmix-demo.gif)](assets/delayed-yt-vmix-live-jump.png)

Configure the stream and delay, copy the page URL into a vMix **Web Browser**
input, then click YouTube's LIVE button in the vMix preview. The readout drops
to the live edge and Delayed YouTube seeks back to the configured delay.

<sub>The stream shown is a third-party YouTube live stream, and its content
belongs to its channel. To make the readout legible in a GIF, the vMix input uses
the CSS box with `#delay-info{font-size:56px !important;opacity:1 !important}`;
that is optional.</sub>

Delayed YouTube is a small web tool for keeping a YouTube player at the
position you expect. In live mode, it watches a live stream with a fixed delay.
In video mode, it treats a normal YouTube video as if it started at a local
clock time, then corrects sudden jumps to another position.

## Quick start

1. Open [Delayed YouTube](https://live-miracles.github.io/delayed-yt/).
2. Paste a YouTube video ID or YouTube URL.
3. Select **Live** for a live stream, or **Video** for a normal video.
4. Set the starting delay for live streams, or the video start time for video
   mode. For example, use `21:30:00` if the video should behave as though it
   started at 9:30 PM local time.
5. Click **Update**.

## What problem does it solve?

YouTube live streams can unexpectedly jump back to LIVE after buffering,
network fluctuations, browser refreshes, or player hiccups. That is especially
painful when you are intentionally watching with a delay: for example, if you
are 15 minutes behind LIVE and YouTube jumps forward, those 15 minutes are
skipped and cannot be watched in sequence.

Delayed YouTube helps by monitoring the player position and automatically
bringing playback back to the expected point. For live streams, that means
returning to the configured delay when YouTube drifts too close to LIVE. For
video mode, that means returning to the expected position based on the local
clock time when the video started.

## Common uses

- Keeping an OBS or vMix browser source safely behind LIVE.
- Watching a live stream with others while preserving a shared delay.
- Monitoring a broadcast with time to react before the live moment.
- Recovering automatically when YouTube tries to skip ahead after buffering.
- Playing a normal video as if it started at a known local time, such as
  `21:30`, and correcting accidental jumps.

## How it behaves

In live mode, the page tracks the stream duration and the current player time.
If YouTube jumps too close to LIVE, Delayed YouTube seeks back to the configured
delay.

In video mode, the page tracks where the video should be based on the local
time when the video began. If the current time is 21:45 and the video start is
set to 21:30, the expected video position is 15 minutes. If the player suddenly
jumps away from that expected position, Delayed YouTube seeks back. The
adjustment buttons let you fine-tune the playback position while the page is
running.

## Limitations

Live mode depends on the YouTube Player API duration reported for active
streams, so it only works for streams that started at least 30 minutes ago. If
the source stream itself stops, YouTube may remove that missing segment, and you
may need to refresh the page or adjust the delay manually.

## Development

```sh
npm install
npm run dev
```

Common npm commands:

```sh
npm run build
npm test
npm run format
npm run format:check
```

The website root lives in `public/`, and the TypeScript source lives in
`public/ts/`. Every push to `master` runs GitHub Actions, executes the tests,
builds the ignored assets, and publishes the current site to GitHub Pages.
