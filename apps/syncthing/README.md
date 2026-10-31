# Syncthing

Syncthing keeps folders identical on several devices: a laptop, a phone, this machine. Devices talk to
each other directly and encrypt everything on the way; there is no account and no server in the middle.
With Harbor's box always on, your other devices always have someone to sync with, even when they are
never online at the same time.

- Website: https://syncthing.net
- Documentation: https://docs.syncthing.net
- Source code: https://github.com/syncthing/syncthing (MPL-2.0)

## What Harbor does

- Runs the official `syncthing/syncthing` image. Its web page (the GUI) is published like any other app;
  devices connect on UDP port 22000, which Harbor opens on every network of this machine.
- Gives Syncthing's page a login right after the first start (user `admin`, a generated password shown
  once when the install finishes). Until then, a few seconds, the page would be open to anyone who can
  reach it. A login you changed stays as it is. If the login is ever removed, Harbor puts back the
  password it showed at install at the next start, and never shows it again: keep it. To change the
  login, set a new one (Actions, Settings, GUI) rather than removing it.
- Turns off Syncthing's automatic crash reports (it sends them to crash.syncthing.net by default) in that
  same step. Turn them back on under Actions, Advanced, Options, Crash Reporting Enabled if you like;
  Harbor only touches it again when it has to put the login back. Usage reporting stays off until you
  answer Syncthing's own question about it.
- Names this device "Harbor" (Syncthing would use the container's random name). Rename it under
  Actions, Settings, General if you like.
- Generates the API key its own setup step uses, and keeps it as a retained secret.

## First run

1. Open Syncthing and sign in as `admin` with the password Harbor showed. If it opens without asking
   for a password, set a login now under Actions, Settings, GUI. If it refuses that password, someone set
   another login before Harbor could: uninstall Syncthing completely and install it again.
2. Install Syncthing on your other devices (https://syncthing.net/downloads/). On Android, use the
   community app Syncthing-Fork; on iPhone, Möbius Sync. There is no official phone app any more.
3. Add each device on both sides (Add Remote Device, with the other side's device ID), then add a
   folder (Add Folder) and share it with them; each device that accepts it picks where it goes there.
4. For fast syncing at home, edit this device on each other device (Edit, Advanced, Addresses) and set
   `quic://<this machine's LAN address>:22000, dynamic`.
5. To sync directly from outside your home network, forward UDP 22000 on your router to this machine.

## Storage

- `data` (mounted at `/var/syncthing`): your synced folders, Syncthing's settings, this device's keys
  and its database (`config/`). Syncthing starts with no folders; every folder you add must live under
  `/var/syncthing`. The path Add Folder suggests, `~/<folder name>`, already does: `~` is
  `/var/syncthing` here.
- Syncthing writes everything there as user and group 1000.
- There is no option to use a folder of your own (a big disk) yet: the image takes ownership of
  `/var/syncthing` on every start, which would lock Harbor out of that folder, and the same path holds this
  device's keys, which stay in Harbor's managed storage and its backups.
- The volume is kept when you remove the app; only *Uninstall completely* deletes it.

## Limits on Harbor

- **No LAN discovery.** Syncthing runs on its own private network here, so other devices on your LAN do
  not find it on their own. They reach it through global discovery and relays until you give them the
  `quic://` address above.
- **UDP only.** Only Syncthing's QUIC listener (UDP 22000) is published, not its TCP one. A network that
  blocks UDP falls back to the relays, which are slower.
- **One copy per machine**, because the port is fixed. A Syncthing installed directly on this machine
  already holds port 22000; Harbor then refuses the install.
- **Leave "Use HTTPS for GUI" off** (Actions, Settings, GUI). Harbor gives the page its HTTPS addresses
  itself (secure LAN, Tailscale or a domain); Syncthing's own HTTPS would stop Harbor from reaching it.
- **Other apps can read Syncthing's login cookie.** Syncthing does not mark its login cookie HttpOnly, so
  Harbor's cookie firewall passes it unchanged, and the browser hands it to every app on the same address
  of this machine (the LAN name or address on any port, secure LAN, the tailnet name). An app there could use it to
  take over Syncthing and share your folders with a device of its own. Keep only apps you trust on this
  machine, leave "Stay logged in" unticked and log out (Actions, Log Out) when you are done.
- The page controls every device and folder; publish it on your tailnet rather than on a public domain.
- **Fast transfers need bigger UDP buffers.** On a stock Ubuntu host, QUIC on UDP 22000 cannot get the
  receive buffer it asks for, which can slow large transfers. Raise it once on the host with
  `sudo sysctl -w net.core.rmem_max=7500000 net.core.wmem_max=7500000`, and keep it across reboots with a
  file in `/etc/sysctl.d/`. See https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes.
