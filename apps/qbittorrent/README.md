# qBittorrent

A free, open-source BitTorrent client, here without a desktop: you use its web interface from any browser.
Add torrent files or magnet links, choose which files of a torrent to fetch, set speed limits and schedules,
search with plugins, and follow RSS feeds that download new items on their own. It shows no ads.

- Website: https://www.qbittorrent.org
- Source code: https://github.com/qbittorrent/qBittorrent
- Image: https://github.com/linuxserver/docker-qbittorrent (linuxserver.io)
- Help: https://github.com/qbittorrent/qBittorrent/wiki

## What Harbor does

- Runs qBittorrent (the linuxserver.io image) on a private network; Harbor publishes the web interface itself.
- Opens UDP 6881 on every network of this machine for other peers (uTP and DHT). That is a fixed port, so
  only one copy of qBittorrent can run.
- Creates the WebUI login: user `admin` and a generated password, shown once when the install finishes.
  Keep it in a password manager; Harbor cannot show it again.
- After every start, an after-start hook checks qBittorrent's settings file and, when something is missing,
  stops qBittorrent for a moment, sets it and starts it again:
  - turns off the WebUI's Host-port check, which would otherwise refuse every Harbor address (they all use a
    port other than qBittorrent's own 8080);
  - turns on reverse-proxy support and sets the trusted proxy list to Harbor's own proxies, so logins work
    over the secure LAN address, Tailscale and your domains;
  - writes the generated password, only while qBittorrent has no password at all. A password you set
    yourself stays.
- Then the hook checks the result from inside the container. If qBittorrent still refuses an address with
  another port, or the password it just wrote does not log in, the web interface would be useless through
  Harbor, so the hook stops qBittorrent: Harbor then shows the app as not answering (with the reason in the
  app's log) instead of healthy. Restart the app to try again.

## First run

1. Open qBittorrent and sign in as `admin` with the password from the install result.
2. Optionally change the password (and the user name) under **Tools → Options → WebUI**.
3. Add a torrent file or a magnet link. Files are saved to `/downloads`, the folder you chose at install.
4. For more peers, forward UDP 6881 on your router to this machine. Downloads work without it, but slower.

## Storage

- `config`: settings, the torrent list and resume data (`/config`).
- `downloads`: downloaded files (`/downloads`). You can point this at a folder of your own at install time,
  and you should: a folder on a large drive, for example `/mnt/downloads`. The image makes that
  folder (only its top level) owned by uid 1000 so qBittorrent can write in it; existing subfolders keep
  their owner and may need `sudo chown -R 1000:1000` if qBittorrent should write there too.
- That folder must not be inside another app's folder, nor contain one: Harbor refuses folders that overlap
  between apps. So use `/mnt/downloads` next to Jellyfin's `/mnt/media`, not `/mnt/media/downloads`.
- Jellyfin and other apps cannot read these downloads yet, because Harbor has no folders shared between
  apps. Move finished files into your media folder yourself.
- Downloads left in the app's own volume live inside the app's home, so every backup of this app copies
  them all. A folder of your own is never part of the app's backups.
- Managed volumes and your folders are kept when you remove the app; Harbor never deletes them.

## Lost the password

Harbor writes its password again only while qBittorrent has none, so a lost password is reset by removing
qBittorrent's. From a terminal on the machine (over SSH; in the console's own terminal under Settings →
Advanced access, leave out `sudo`):

1. Find the container: `harbor inspect qbittorrent` lists it on its `container server` line.
2. Stop qBittorrent inside it and remove its password:
   `sudo docker exec <container> sh -c 's6-svc -wD -d /run/service/svc-qbittorrent && sed -i /Password_PBKDF2=/d /config/qBittorrent/qBittorrent.conf'`
3. Then either:
   - you still have the password from the install: **Restart** the app in Harbor, and it works again;
   - you do not: `sudo docker exec <container> s6-svc -u /run/service/svc-qbittorrent`. qBittorrent
     starts without a password and prints a temporary one in its log (the app's logs under Troubleshoot).
     Sign in with it and set a new password under **Tools → Options → WebUI** right away, before the
     next restart (a restart without a password set puts the install password back).

## Limits on Harbor

- Peers reach it only over UDP (uTP). Harbor publishes UDP ports only for now, so peers that speak plain TCP
  cannot connect in; qBittorrent still connects out to them.
- Keep the listening port (**Tools → Options → Connection**, port used for incoming connections) at 6881:
  Harbor publishes only UDP 6881, and the image sets 6881 again on every start.
- The WebUI's Host-port check is off, as in most reverse-proxy setups. The login stays on, and so does
  qBittorrent's ban of an address after 5 failed logins (for an hour). Over the secure LAN address Harbor
  passes the real client address on; requests that come through a proxy without a client address (from a
  browser on the machine itself, for example) share a single ban.
- Every start sets the Host-port check, reverse-proxy support and the trusted proxy list back the way
  Harbor's addresses need them; your own changes to those three settings do not last.
- To show each peer's country, qBittorrent downloads a free country database from db-ip.com
  (download.db-ip.com) every month. Turn **Resolve peer countries** off under **Tools → Options →
  Advanced** if you do not want that; Harbor leaves that setting alone.
- Apps on Harbor are isolated from each other, and no app here links to qBittorrent yet. A client such as
  autobrr (Sonarr and Radarr later) would reach it through its LAN address with the admin login, which needs
  Harbor in LAN mode (the default localhost-only address is not reachable from another app). Not tested yet.
- Only download what you have the right to share.
