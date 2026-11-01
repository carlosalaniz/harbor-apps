# ws-scrcpy image

[ws-scrcpy](https://github.com/NetrisTV/ws-scrcpy) (MIT) shows and controls an Android device in the browser over
adb. Upstream publishes no container image, so this folder builds one from a pinned upstream commit
(`build.json`) and `.github/workflows/images.yml` pushes it to `ghcr.io/carlosalaniz/ws-scrcpy:<tag>` for amd64
and arm64. Apps pin the pushed digest like any other image.

- `ADB_CONNECT`: space-separated `host:port` addresses adb keeps connecting to (the redroid app sets
  `android:5555`).
- `HARBOR_INPUT`: `host:port` of the hardware-input daemon (the redroid app sets `android:7008`). Some apps ignore
  input Android marks as coming from a virtual device, which is what scrcpy injects; WhatsApp's registration screen
  is one. With it set, the entrypoint makes adbd root (Android debug builds allow it), pushes `harbor-input`
  (`harbor-input.c`, built static here) to the device and keeps it running; it creates a touchscreen and a keyboard
  through `/dev/uinput`. `HarborInput.ts` (wired into ws-scrcpy's stream proxy by `patch-ws-scrcpy.mjs`) hands it
  the browser's taps, keys and typed ASCII text. Back, Home, Power, volume and non-ASCII text still go through
  scrcpy, as does everything while the daemon is not reachable. The device shell in the browser is a root shell
  then (it was already behind the app's login, on a privileged container).
- Port 8000, plain HTTP, **no login of its own**: put it behind something that asks for one (the redroid app's
  `proxy` service does).
- Runs as the image's `node` user; adb keys live in the container and are not kept (redroid accepts adb
  without a key).

To move upstream: change `commit` and `tag` in `build.json` together, push, then pin the new digest in the apps
that use it (`node scripts/catalog-pin.mjs <app>` from the Harbor repository).
