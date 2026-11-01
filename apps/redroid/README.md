# Android (redroid)

[redroid](https://github.com/remote-android/redroid-doc) runs Android 15 in a container on this machine.
Its screen opens in your browser through [ws-scrcpy](https://github.com/NetrisTV/ws-scrcpy), behind Harbor's
login page.

## Before you install

- **Full control of this machine.** Android only runs in a *privileged* container, so the app could read, change
  or erase anything on this machine. Harbor gives that permission only to apps from its own catalog, and you
  accept it in the install review.
- **Android's binder driver.** Harbor loads `binder_linux` into the kernel when the app first starts, and again
  at every boot. Ubuntu ships it in `linux-modules-extra-<kernel>`; if your kernel lacks it, the install says
  which package to add (`sudo apt install linux-modules-extra-$(uname -r)`). Harbor never installs system
  packages itself.
- About 1 GB to download, and 2 GB of memory while it runs.

## Using it

1. Open the app and type its **password**. Harbor shows it once after install; later, the app's drawer shows it
   again (Login → Show password…) and can change it.
2. The first start takes a minute or two. When Android is up, the device appears in the list: pick a player.
   *WebCodecs* is the smoothest; it needs the secure (https) address. The others work over plain http.
3. Click and type to use Android. The screen is 720x1280 at 320 dpi, drawn without a graphics card.

Your clicks and keys reach Android as a real touchscreen and keyboard, not as injected input: some apps ignore
injected input, WhatsApp's registration among them. Back, Home and the other buttons beside the screen work as
before.

There is no Google Play. Install apps from APK files (drag them onto the screen, or use the file list) or from an
open store such as F-Droid.

**WhatsApp** says it found a custom ROM; tap OK. If it opens "Link as companion device" and you want this to be
your WhatsApp number instead, use ⋮ → Register new account.

The device list also offers a **shell** on Android: anyone with the password has it, and Android has full control
of this machine. Keep the password to yourself, and do not publish the app on the internet.

## Data

Everything Android keeps (apps, accounts, settings) lives in the `data` volume, which survives updates and
reinstalls. Uninstall completely to erase it.

## Under the hood

| Service | Image | Role |
|---|---|---|
| `android` | `redroid/redroid` 15.0.0-250627 | Android itself; adb on port 5555 inside the app network only |
| `screen` | `ghcr.io/carlosalaniz/ws-scrcpy` | browser screen, built by this repository from a pinned upstream commit (`images/ws-scrcpy`); Harbor's login is always in front of it (`login: required`) |
