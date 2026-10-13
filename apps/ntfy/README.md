# ntfy

Your own push-notification server. Anything that can make an HTTP request (a backup script, a cron job,
Home Assistant, Uptime Kuma, Harbor itself) sends a message to a *topic*, and every phone or browser
subscribed to that topic gets it a moment later:

```sh
curl -H "Authorization: Bearer tk_..." -d "Backup finished" http://<this app's address>/backups
```

- Website and docs: https://ntfy.sh, https://docs.ntfy.sh
- Source code: https://github.com/binwiederhier/ntfy
- Phone apps: ntfy on Google Play, F-Droid and the App Store

## What Harbor does

- Runs the ntfy server (one container) on a private network; Harbor publishes its web page and API.
- Makes it a private server: sign-ups are off and nobody can read or send without a login or an access
  token (`auth-default-access: deny-all`).
- Generates the admin password, shows it once after the install, and creates the `admin` account with
  ntfy's own `ntfy user add` after every start (it leaves an existing admin, and a changed password, alone).
- Hands ntfy its main address (`base-url`), used for attachment links and the iPhone relay.
- Leaves the ntfy.sh relay for iPhones off unless you type its address (at install or later, see *iPhones*):
  without it, nothing leaves this machine.

## First run

1. Open ntfy and sign in as `admin` with the password Harbor showed you. Keep this login for yourself:
   it, and every access token made from it, can also add, remove and change users.
2. Give scripts and phones their own users with limited rights (*More people and scripts* below), and make
   their access tokens while signed in as them (**Account → Access tokens** in the web app).
3. Subscribe on your phone: in the ntfy app, add this server's address with a login or token under
   **Settings → Manage users**, then subscribe to a topic name of your choice on this server. On an iPhone,
   use exactly the address described in *iPhones*.
4. To get Harbor's own alerts on your phone: in Harbor's **Settings → Notifications**, add an ntfy channel
   with `http://localhost:<port>` as the server, a topic, and a token of a user that may write to it. The
   port is the one in ntfy's plain `http://` address: `harbor inspect ntfy` prints it
   (`loopback http://localhost:<port>/`), and a console opened over https shows that number plus 20000. Not
   the secure-LAN `https://` address: Harbor does not trust its own local certificate when it sends.

## More people and scripts

ntfy has no web page for managing users; the admin uses its API (`/v1/users`, `/v1/users/access`). For
example, a user that may only send, to every topic, and a token for one script:

```sh
curl -u admin:<admin password> -d '{"username":"scripts","password":"<a long password>"}' <address>/v1/users
curl -u admin:<admin password> -X PUT -d '{"username":"scripts","topic":"*","permission":"write-only"}' <address>/v1/users/access
curl -u scripts:<its password> -X POST <address>/v1/account/token
```

Use `read-only` the same way for phones, and `read-write` for a person who does both. A `topic` can also be
one name or a pattern such as `backups*`. Give every user you add a long password (see *Limits*).

## iPhones

iOS only wakes the ntfy app for pushes that Apple delivers. Without help, an iPhone shows new messages when
you open the app, or whenever iOS lets it refresh in the background (minutes, sometimes hours). Android
needs no help.

**The ntfy.sh relay** makes it instant. Type `https://ntfy.sh` in the first optional value at install, or
later on the app page (**Values you provided → Change…**; CLI: `harbor configure ntfy --secret ios-relay=-`
with the address on stdin). Saving it empty turns the relay off again. With it on, ntfy
asks ntfy.sh, for every message on every topic, to send the iPhone a "poll" ping; the app then fetches the
message from this server. ntfy.sh never sees the text, but it does see this machine's public IP address,
when each message is sent, and a hash of the topic's address. It allows 250 of these a day per public IP
address for free (every message counts, iPhone or not); past that, iPhones are back to delayed delivery
until the next day. The token of an ntfy.sh account with a higher limit, in the second value, lifts it.

**The iPhone must use exactly the main address.** ntfy and the iPhone app each hash the server address plus
the topic, and the ping only wakes a phone whose hash matches. Add the server on the iPhone with exactly the
address Harbor gave ntfy at install:

- *This network* (the default): `https://<machine name>.local:<secure port>`, or
  `http://<machine name>.local:<port>` when secure addresses are off. Not `harbor.local`, not an IP
  address, not the other scheme, all in lowercase. The machine name is in **Settings → Overview**. The easy
  way: open Harbor at `https://<machine name>.local/`, open ntfy from there, and copy the address from the browser. The iPhone
  must also trust Harbor's certificate (**Settings → Network → How to trust it on a new device…**: install
  the profile, then turn on full trust).
- Better for iPhones: make the **Tailscale or domain address** the main one (**Publish… → Make primary**).
  The console shows that address as it is, and it works at home and away (Tailscale needs its app running
  on the phone).

To check: lock the iPhone and send a test message. If it only shows up once you open the app, the address
does not match, or the relay is off or mistyped (ntfy still runs then; its log says `Unable to publish poll
request`, also when the daily limit is used up).

**Changing the main address** recreates ntfy right away with the new address: re-add the subscriptions on
iPhones afterwards. Turning secure addresses on or off, or renaming the machine, changes it at the next
Restart (the Network card lists the apps waiting for one).

## Storage

- `data` (`/var/lib/ntfy`): `user.db` (accounts, access tokens, topic permissions), `cache.db` (messages of
  the last 12 hours, so a phone that was offline catches up) and `attachments/` (files sent with a message,
  kept 3 hours, 15 MB per file and 5 GB in total). Retained on remove; Harbor never deletes it unless you
  uninstall the app completely.

## Limits on Harbor

- **Phones away from home** reach the server only if you publish it on your tailnet or a domain
  (Publishing). On the home network the LAN address is enough.
- **Guessing passwords on the plain LAN port.** ntfy limits failed sign-ins per visitor, but to work behind
  Harbor's proxies it believes the visitor address a request says it comes from (`behind-proxy`). On the
  plain `http://` app port a device on your network can claim a new address each time and keep guessing.
  The generated admin password is far too long to guess; give the users you add long passwords too, or turn
  on **HTTPS only** (Settings → Network, under Secure addresses), which takes the plain app ports off the
  network.
- **Browser notifications** need HTTPS: open ntfy over the secure LAN, Tailscale or a domain address.
  Background Web Push (notifications with the tab closed) is not set up; the phone apps cover that.
- E-mail and phone-call notifications, and paid tiers, are not configured.
