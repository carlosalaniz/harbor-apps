# ws-scrcpy image

[ws-scrcpy](https://github.com/NetrisTV/ws-scrcpy) (MIT) shows and controls an Android device in the browser over
adb. Upstream publishes no container image, so this folder builds one from a pinned upstream commit
(`build.json`) and `.github/workflows/images.yml` pushes it to `ghcr.io/carlosalaniz/ws-scrcpy:<tag>` for amd64
and arm64. Apps pin the pushed digest like any other image.

- `ADB_CONNECT`: space-separated `host:port` addresses adb keeps connecting to (the redroid app sets
  `android:5555`).
- Port 8000, plain HTTP, **no login of its own**: put it behind something that asks for one (the redroid app's
  `proxy` service does).
- Runs as the image's `node` user; adb keys live in the container and are not kept (redroid accepts adb
  without a key).

To move upstream: change `commit` and `tag` in `build.json` together, push, then pin the new digest in the apps
that use it (`node scripts/catalog-pin.mjs <app>` from the Harbor repository).
