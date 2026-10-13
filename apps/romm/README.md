# RomM

RomM turns a folder of your own game backups into a browsable library: it recognises each game, fetches
its cover art, screenshots and description, and lets you play most classic consoles right in the browser
(EmulatorJS, plus Ruffle for Flash, js-dos for DOS and Windows 3.x/9x, PICO-8 and EasyRPG). Saves and
save states are kept per player, and family members get their own accounts.

- Website: https://romm.app
- Documentation: https://docs.romm.app
- Source code: https://github.com/rommapp/romm (AGPL-3.0)

## What Harbor does

- Runs RomM (the full image, with the in-browser players) and MariaDB on a private network; only RomM's
  web page is published.
- Generates the sign-in signing key, the database password and the database root password once, and keeps
  them as retained secrets.
- Hands RomM its main address (`ROMM_BASE_URL`) for invite and password-reset links; it follows a change of
  main address after a Restart.
- After every start, lets RomM's built-in web server (user 1000, which serves every download and every
  in-browser game) pass through the folders Harbor manages for the app. A games folder of your own is never
  changed: Harbor only checks it, and the start's events say so if the web server cannot enter it (see
  Storage).
- Turns on Hasheous, a free service that matches games by their file hash and needs no account.

## Storage

- `library`: your games and BIOS files. You may point it at a folder of your own at install time
  (optional), e.g. `/mnt/games`; otherwise Harbor keeps it in a managed volume. Prepare your own folder once
  with `sudo chmod o+x /mnt/games` (lets others pass through it, not list it): without that, the library and
  Scan work but Download and Play answer 403.
- `data`: covers, screenshots and manuals RomM downloads, saves and states uploaded from the browser
  players, and `config.yml` (the settings RomM writes from its own pages).
- `database`: MariaDB with the library index, users and play history.
- `cache`: the built-in Valkey (sign-in sessions, task queue, metadata lookups). It is saved hourly and
  when RomM stops cleanly, so a restart, a backup run or a reboot normally keeps everyone signed in.
- Managed volumes and your folders are retained on remove; Harbor never deletes them. A managed `library`
  volume is part of the app's backups, so a large collection makes large backups.

## First run

1. Open RomM. Its setup wizard creates the admin account and asks which consoles you have; it creates
   `roms/<platform>/` for each one in the games folder. Make `bios/<platform>/` yourself, or upload firmware
   in RomM.
2. Put games into those folders (`roms/gba/`, `roms/snes/`, ...), or upload them from RomM's library page.
   RomM runs as root, so its folders belong to root: copy as root (`sudo cp` or `sudo rsync`). Files RomM
   writes, uploads included, are owned by root too.
3. Press **Scan**. Games show up with covers as they are matched.
4. Optional: invite other players from RomM's user settings; each one gets their own saves.

## Better matches (optional)

Hasheous finds most well-known games. Harbor asks for these at install, and you can add or change them later
on the app page under *Values you provided*:

- **ScreenScraper** username and password (free account at screenscraper.fr): box art, screenshots and
  descriptions for most retro systems.
- **RetroAchievements** web API key (retroachievements.org, Settings, Keys): achievements per game.
- **SteamGridDB** API key (steamgriddb.com, Preferences, API): extra cover art.

## Limits on Harbor

- **Folder layout.** RomM reads `roms/<platform>/` at the top of the games folder (the folder names Batocera,
  RetroBat and ES-DE use work too). A library laid out the other way round, `<platform>/roms/`, must be declared
  in `config.yml`, which RomM's pages cannot write; reorganise such a library before pointing RomM at it.
- **File permissions.** RomM's web server (user 1000) must be able to read the game files. Files RomM
  writes, and files copied in with the usual permissions (0644), are fine. A game copied in as 0600 is
  listed but answers 403 on Download and Play; fix it with `sudo chmod -R o+rX` on the games folder.
- **Uploads need room twice.** A browser upload is first stored whole where the app's data lives (the system
  disk, or the app's drive), then moved into the games folder. A large disc image needs that much free space
  there as well.
- **Faster emulator cores need HTTPS.** Multi-threaded cores need cross-origin isolation, which browsers only
  grant on a secure address (secure LAN, Tailscale or a domain). Over plain http the library works and most
  consoles still play.
- **Console feeds over the secure LAN address.** Feeds and exports (Tinfoil, PKGi, WebRcade, Pegasus) write
  links that point at the machine itself when fetched over the secure LAN address. Give consoles the plain
  http LAN address.
- **RomM's own update banner.** RomM checks GitHub and shows a "new version available" banner within hours of
  a release. On Harbor, updates arrive through the App Store a few days later; dismiss the banner until then.
- **Memory.** RomM runs a web server, three background workers, Valkey and MariaDB. Upstream asks for at
  least 512 MB and is comfortable with 2 GB; this package lowers the web workers and scan workers to 2.
- **One-way updates.** RomM migrates its database on every start, so going back to an older version
  means restoring a backup. Turn on the app's backups: an automatic update then backs it up first.
- **Big libraries: update by hand.** Some releases rewrite large tables on first start, which can take longer
  on a big library than Harbor waits for an app to answer (10 minutes). Harbor would then put the old version
  back on a half-migrated database. With a large collection, turn automatic updates off, read the release
  notes, update with a fresh backup, and restore that backup if the update fails.
- Not set up here: emulator streaming, SSH sync to handheld devices, and OpenID Connect sign-in.
- Bring only games you own. RomM ships no games or BIOS files.
