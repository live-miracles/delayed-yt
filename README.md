# Delayed YouTube

**Watch a YouTube live stream a fixed time behind LIVE, and stay there.** If
YouTube skips ahead after buffering or a refresh, Delayed YouTube seeks back to
your delay automatically. Built for vMix and OBS browser sources, shared
viewing, and anyone who needs a reliable stream delay.

[![Live demo](https://img.shields.io/badge/live%20demo-open%20the%20app-red?logo=youtube&logoColor=white)](https://live-miracles.github.io/delayed-yt/)
[![Deploy](https://github.com/live-miracles/delayed-yt/actions/workflows/deploy.yml/badge.svg)](https://github.com/live-miracles/delayed-yt/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/github/license/live-miracles/delayed-yt)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![Delayed YouTube in vMix. In Chrome, a YouTube live link is pasted into the Video ID field, the starting delay stays at 15 minutes, and Update loads the player above the form. The page URL is copied and added in vMix as a Web Browser input. Clicking different spots on YouTube's timeline in the vMix preview throws the stream to other moments, and each time Delayed YouTube seeks it back to the 15 minute delay.](assets/delayed-yt-vmix-demo.gif)](assets/delayed-yt-vmix-live-jump.png)

Configure the stream and delay, copy the page URL into a vMix **Web Browser**
input, then try to break it: click anywhere on YouTube's timeline or on LIVE in
the vMix preview. The stream jumps away, and Delayed YouTube seeks back to the
configured delay within a second or two.

<sub>The stream shown is a third-party YouTube live stream, and its content
belongs to its channel.</sub>

Delayed YouTube is a small, static web tool (no server, no account, no install)
for keeping a YouTube player at the position you expect. In **live mode**, it
watches a live stream with a fixed delay. In **video mode**, it treats a normal
YouTube video as if it started at a local clock time, then corrects sudden
jumps to another position.

## Features

- Fixed delay behind LIVE for any YouTube live stream, with automatic recovery
  when YouTube jumps to the live edge.
- Video mode that plays a normal video as if it started at a chosen local
  clock time.
- Accepts a video ID or any YouTube URL.
- All settings live in the page URL, so one copied link is a complete
  configuration for a vMix or OBS browser source.
- Runs entirely in the browser and is hosted on GitHub Pages.

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

> Works in vMix (Web Browser input), OBS (Browser Source), and any regular
> browser.

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
jumps away from that expected position, Delayed YouTube seeks back.

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

This serves the site at <http://localhost:3000> and rebuilds TypeScript and
[Tailwind CSS](https://tailwindcss.com/) on every save. There is no live reload: refresh the page manually to see
changes.

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

## License

[MIT](LICENSE)
