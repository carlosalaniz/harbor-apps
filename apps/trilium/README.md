# Trilium Notes

A personal knowledge base: notes in a tree as deep as you like, with rich text, code, canvas and mind map notes, full-text search, per-note encryption and sync with the Trilium desktop app.

This is the server edition of Trilium. You use it in the browser (it has a touch-friendly mobile layout for phones), and it is also the sync server for the Trilium desktop app on your computers.

## What Harbor does

- Runs the official Trilium image on a private network; only its web page is published, on 127.0.0.1 by default.
- Keeps everything Trilium writes in one retained volume.
- Checks `/api/health-check`, which answers before the knowledge base exists, so the install finishes on the setup page.

## Storage

- `data` (`/home/node/trilium-data`): the notes database (`document.db`), attachments, Trilium's own automatic backups (daily, weekly and monthly copies of the database, in `backup/`), logs and the session key.
- There is no option to use a folder of your own: the image's start script re-owns everything under `/home/node` to uid 1000 on every start, so it would re-own your folder too. Harbor's rule is that your folders are never re-owned, so this package does not offer one. Notes are small; the managed volume is enough.
- The volume is retained on remove; Harbor never deletes it. Harbor backups of this app include Trilium's own backup copies.

## First run

Open Trilium right after the install. Until it is set up, whoever reaches the page first can claim it. The setup page offers a new knowledge base, sync from another device, or restoring a backup file. Pick the case that fits:

- **New knowledge base**: create it, then set the password you will log in with.
- **You already use the Trilium desktop app**: create nothing on the server. In the desktop app, open Options, Sync, enter this app's address as the server address and click *Test sync*. The desktop pushes all its notes, and the server takes the desktop's password. The server's page turns into the login screen when the push is done; until then its setup page stays open to anyone, so start the push right after the install.
- **A new desktop app, with this server already set up**: in the desktop's setup wizard, choose to sync from a server and enter this app's address and your password.

Away from home, give the desktop a Tailscale or domain address of this app.

## Limits on Harbor

- **Desktop app versions must match.** Trilium only syncs between versions with the same sync protocol. When Harbor updates this app, update the desktop app too. The same goes for TriliumDroid and other third-party clients; there is no official mobile app, the mobile web page is the official way in on phones.
- **The update badge is Trilium's own.** Every browser tab and desktop app asks GitHub for a new Trilium release every 8 hours and shows *Update available* in the menu, with a download link. That link is for the desktop app: Harbor updates this server itself, a few days or more after upstream's release. Turning off *Check for updates automatically* (Options, Other) stops the badge and the requests to GitHub; the setting syncs to every device.
- **Backend scripts and the SQL console are off.** Trilium's server edition ships with both turned off, and this package keeps it that way. Front-end scripts, widgets and themes still work, except front-end scripts that call the backend (`api.runOnBackend`): those fail.
- **The server clock is UTC.** Journal (day note) dates and note times follow the clock of your browser or desktop app, which sends its local time with every request. Only Trilium's own scheduled jobs (backups, logs) and API calls that send no local time use the server's UTC clock; there is no setting for it.
- **One shared login limit.** Trilium blocks logins after 10 wrong passwords in 15 minutes from one address. Behind Harbor every visitor looks like the same address, on the secure LAN, Tailscale and domain addresses and on 127.0.0.1 alike, so there is one counter for all of them, desktop sync logins included. One wrong-password run locks everyone out for 15 minutes, and on a public domain a stranger can keep it tripped with 10 tries every 15 minutes. Publish Trilium on Tailscale or your LAN rather than on a public domain. This package leaves Trilium's forwarded-address trust off on purpose: turned on, it would let anyone who reaches the plain-http LAN address dodge the limit by sending a made-up address.
- **It asks browsers to stay on HTTPS.** Trilium sends an HSTS header (one year, subdomains included). Over a secure address, a browser that trusts Harbor's certificate then opens every address of this machine's name over HTTPS only: plain-http addresses of other apps on `harbor.local` stop opening in that browser, and `?skiphttps` no longer keeps the console on http. If you later turn secure addresses off, `http://harbor.local` itself (the console) stops opening in that browser until you delete its HSTS entry (`chrome://net-internals/#hsts` in Chrome and Edge, or the site's stored data in other browsers). IP addresses are not affected.
- **Running two copies.** Both copies use the same cookie names, and browsers share cookies between the ports of one name. Open them on their secure LAN addresses, where Harbor keeps each app's login apart. On plain-http, 127.0.0.1 or Tailscale addresses, logging into one copy logs you out of the other (its saves then fail with *Invalid CSRF token*), so use a separate browser profile for each.
- **Shared notes are public.** A note you share in Trilium is readable without a login under `/share` on every address the app has. Think about that before publishing the app on a public domain.
- **Keep the password safe.** A forgotten password cannot be reset from the login page: it means editing `document.db` on the machine (upstream's "Resetting your password" guide), and protected (encrypted) notes are lost with it.
- Two-factor login (TOTP, under Options, Password & Auth) works; OpenID login needs settings this package does not offer.

## Links

- Website: https://triliumnotes.org
- Documentation: https://docs.triliumnotes.org
- Source code: https://github.com/TriliumNext/Trilium
- Help: https://github.com/TriliumNext/Trilium/discussions
