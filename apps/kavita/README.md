# Kavita

Reading server for your manga, comics and ebooks: read in the browser, keep progress per person, and sync with
e-readers over OPDS and KOReader.

Kavita reads the books you already have (CBZ/CBR/CB7 archives, image folders, EPUB and PDF), groups them into
series with covers, and gives every person in the house their own account, reading progress, want-to-read list
and age limits.

- Website: https://www.kavitareader.com
- Source code: https://github.com/Kareadita/Kavita
- Help: https://wiki.kavitareader.com

## What Harbor does

- Runs Kavita on 127.0.0.1 with its database and settings in a retained volume.
- Mounts your book folder read-only at /library. Kavita has no upload, so the folder is required at install.
- Lets Kavita believe the forwarded headers of Harbor's own proxies (the secure LAN address, Tailscale and your
  domains). Before every start it writes this network's gateway into `config/appsettings.Production.json`, a
  file Kavita reads and never writes. Without it, the links Kavita builds from the address you opened (EPUB
  pictures and styles, the OPDS address) would point at 127.0.0.1 behind the secure LAN address.
- Turns off the image's own Docker health check: Kavita migrates its database before it starts listening, which
  can take minutes on a large library after an update. Harbor's own check of `/api/health` waits up to 10
  minutes instead.

## Storage

- `config`: Database, settings, covers, bookmarks and logs (`/kavita/config`). Kavita backs up its database
  here before every upgrade.
- `library`: Your manga, comics and books, mounted read-only at /library. Required: The folder with your manga,
  comics and books, for example /mnt/books.
- Managed volumes and your folders are retained on remove; Harbor never deletes them.

## First run

1. Open Kavita and create the first account; it becomes the admin.
2. Under Settings → Server → Libraries, add a library for each kind of book and point it at a folder under
   /library (for example /library/Manga as a Manga library, /library/Books as a Book library). Kavita scans it
   and keeps watching it for new files.
3. Under Settings → Server → General, set Host Name to this app's main address (no trailing slash). Kavita uses
   it for the OPDS address it shows each person and for the invite and password-reset links it hands you to
   pass on when no mail server is set.
4. Invite the rest of the house under Settings → Server → Users.

## Limits on Harbor

- Kavita expects one folder per series inside each library folder; files placed directly in a library folder
  are ignored. Read the wiki's scanner guide before adding a large library.
- The mount is read-only, so Kavita cannot change your files; reading progress, bookmarks and covers live in
  its own volume.
- Anonymous usage statistics go to Kavita's servers once a day by default; the package cannot switch this off
  for you (it is a setting in Kavita's database). Turn it off under Settings → Server → General (Allow Anonymous
  Usage Collection). Kavita+ (paid metadata and scrobbling) is optional.
- A reverse proxy of your own (Harbor's "your own proxy" publish path) is not on Kavita's trusted list: set Host
  Name as above so the links it hands out are right.
- Kavita's image processing needs a CPU with SSE4.2; very old Atom and Celeron machines cannot run it.
- Harbor gives each folder to one app only, read-only or not: the book folder cannot be, contain, or sit inside a
  folder another app already uses (for example Jellyfin's media folder), and a second copy of Kavita needs its
  own folder. Point Kavita at a separate books folder, such as /mnt/books next to /mnt/media.
- The EPUB reader's Copy button needs a secure address (the clipboard is blocked on plain http); use the secure
  LAN address, Tailscale or a domain if you copy text from books.

Upstream: https://www.kavitareader.com
