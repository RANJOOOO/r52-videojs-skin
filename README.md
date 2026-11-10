# R-52 Chart Recorder

A [Video.js v10](https://videojs.org) skin built like a lab strip-chart recorder.

**Live:** https://ranjoooo.github.io/r52-videojs-skin/

The timeline is chart paper. A pen writes the video's sound onto it as it plays, in red ink. The rest of the sound sits ahead of the pen as a faint pencil line, so loud and quiet parts are visible before you seek.

- **Gauges** read live player data: BUF (seconds buffered ahead), DROP (dropped video frames), LVL (sound level under the pen).
- **Status lamp**: green running, amber loading, red on a fault.
- **Paper speed** is the playback rate.
- Keyboard: Space/K run and hold, arrows seek and set volume, M mute, F fullscreen, 0-9 jump through the chart. Focus is always visible.
- Responsive down to phone width, calms down under `prefers-reduced-motion`, forced-colours aware.

Built with Video.js v10 UI components (`@videojs/cdn@10.3.0`), plain HTML, CSS and a small canvas script (`recorder.js`). No build step.

The video is Juno, an original ARKit 52 talking head I built and rigged in three.js.

## Run locally

Serve the folder with any static server that supports byte ranges, for example `npx http-server .`

## License

Apache License 2.0. © 2026 Muhammad Ali Sabir.
