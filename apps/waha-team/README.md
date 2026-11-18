# WAHA Team

One WhatsApp number for the whole team. Everyone signs in with their own WAHA Team account, sees every chat, claims
the ones they handle, and every message they send ends with their name, so the contact knows who wrote it:

```
Your order shipped today.

— Ana
```

WAHA Team sends and receives through WAHA (the WAHA app on this machine, or any WAHA you point it at), and keeps
WhatsApp linked by itself: when WhatsApp unlinks WAHA, WAHA Team asks WAHA for a pairing code and Android Link types
it on the phone.

- Source code: https://github.com/carlosalaniz/waha-team

## What it does

- **Accounts** for your team: admins (people, the WhatsApp connection) and agents (chats).
- **Shared inbox with claims**: All, Mine, Unclaimed, Team, Groups; sort by latest message or unanswered first (with
  how long each chat has waited). A claim tells the others who handles a chat; it never
  stops them from answering. Admins assign chats.
- **Signed messages**: texts and captions end with "— Name". Voice notes, stickers and reactions cannot carry text, so
  they go out unsigned (WAHA Team still shows who sent them). Messages typed on the phone show as **Phone**.
- **Photos, videos, files and voice notes** (recorded in the browser), **edit** (first 15 minutes, the signature stays)
  and **delete for everyone** (first 2 days).
- **Push notifications** on every device, with the tab closed: "María López → Claimed by Ana" and the message. Each
  person picks all chats, their chats and unclaimed ones, or only theirs, and can mute chats. On iPhone and iPad, add
  WAHA Team to the Home Screen first (Share → Add to Home Screen).
- **History**: copies earlier messages from WhatsApp after linking.
- **Several WhatsApp numbers**: add numbers on the WhatsApp connection page (each one is a WAHA session, labelled and
  coloured), switch between them at the top of the inbox, and choose who can use each number. Notifications say which
  number they're about.
- **Archive** chats from the long-press menu or chat info; they're archived on the phone too, and come back when the
  contact writes again.
- **Pinned chats for the whole team** (separate from the phone's pins): long-press a chat (or right-click it) and
  choose Pin for the team. A **Team** filter narrows the list to one teammate's chats.
- **Contacts**: the team's address book. Names replace raw numbers everywhere; names WhatsApp already has are offered as
  suggestions. They're kept in WAHA Team, not on the phone.
- **Saved replies**: type `/` in the message box for price lists, delivery times or payment details, with
  `{first_name}` filled in and one or several files attached.
- **Version and Update**: the About card shows WAHA Team's and WAHA's versions, and an Update button appears when a new
  version is installed, since installed web apps can keep an old page.

## What Harbor does

- Runs WAHA Team on 127.0.0.1 with its data in a retained volume, and generates the first admin's password (user
  `admin`), shown after install and again on the app's **Settings** tab under **Saved passwords**.
- Optional private links: to the **WAHA** app (WAHA's address) and to **Android Link** (for re-linking). Give WAHA's
  API key at install (WAHA app → Settings → Saved passwords → WAHA API key), or later in WAHA Team.
- Keeps Harbor's app login off: WAHA Team has its own accounts.

## Locked out

- The first admin's password stays on the app's **Settings** tab under **Saved passwords** (it is the one Harbor
  generated; if someone changed it in WAHA Team since, it is out of date).
- To set a new one: on the app page, **Values you provided**, the `admin-reset-password` value → **Change…** (or
  `harbor configure <app> --secret admin-reset-password=-`), type any password of 8 characters or more. WAHA Team
  restarts, gives the user `admin` that password, enables it and makes it an admin again. Each new value is applied
  once; change the password in WAHA Team afterwards if you like.

## First run

1. Sign in as `admin` with the password shown after install.
2. Open **WhatsApp connection** (the phone icon). With the WAHA link and its key, the **Session** card lists WAHA's
   sessions: **Use this one**, or type a name and **Create and use it**. WAHA Team follows that session; other apps can
   use the others.
3. Pick the **phone with WhatsApp** (from Android Link), type the **WhatsApp number**, **Save and reconnect**, then
   **Link with the phone now** (or link by hand with the QR code shown there). From then on, if WhatsApp unlinks the
   session, WAHA Team links it again by itself.
4. Add your team under **People**, and turn on notifications on each device (the bell icon).

To use a WAHA or Android Link elsewhere (another machine, a domain), type its address and key on the WhatsApp
connection page instead of linking. An Android Link behind Harbor's login needs its password too.

## Storage

- `data`: accounts, chats and messages, claims, copies of media files, notification subscriptions (`/data`).
- Managed volumes are retained on remove; Harbor never deletes them.

## Limits

- **New numbers get restricted for messaging people first.** When a linked device (WAHA) sends to someone who never
  wrote to the number, WhatsApp can put the account under a "reach-out" restriction for hours and remove the linked
  device. WAHA Team shows the restriction and its end time, pauses sending and re-linking until it ends (the phone keeps
  working), and asks before a first message to a new contact.
- **WAHA is not an official WhatsApp API.** Numbers that send bulk or unsolicited messages get banned. Use a number you
  can afford to lose.
- **Tested versions**: this release was tested with WAHA 2026.10.1 (GOWS engine) and Android Link 0.2.1. With another
  version, sending and re-linking wait until an admin accepts it on the WhatsApp connection page (it warns first).
- WAHA Team shares WAHA with other apps but never deletes or reconfigures a session. It re-links only a session it has
  seen linked, never starts a stopped one, restarts a failed one at most every 5 minutes, and never asks for a new
  pairing code while a link is finishing. Messages other apps send through the same WAHA show as **API**.
- Automatic re-linking needs the phone paired in Android Link, on, and unlocked without a PIN prompt; WhatsApp allows 4
  linked devices (WAHA Team logs out its own old device if WhatsApp is full).
- Push notifications go through the browsers' push services (Google, Mozilla, Apple), end-to-end encrypted.

Upstream: https://github.com/carlosalaniz/waha-team
