# WAHA

WhatsApp HTTP API: link a WhatsApp number once by scanning a QR code, then send and receive messages through a
REST API and webhooks. Use it from n8n, Home Assistant, scripts or your own apps for notifications, chat bots and
support inboxes.

WAHA runs a WhatsApp Web session on this machine and turns it into an API: send text, pictures, files and
locations; read chats; and get every incoming message pushed to a webhook. The dashboard shows the session, its QR
code and an event monitor; Swagger documents every endpoint and lets you try them from the browser.

- Website: https://waha.devlike.pro
- Source code: https://github.com/devlikeapro/waha
- Help: https://waha.devlike.pro/docs/overview/introduction/

## What Harbor does

- Runs WAHA Core with the GOWS engine (no browser inside) on 127.0.0.1, with the session and received files in
  retained volumes.
- Generates the API key and the admin password and shows both once after install. Keep the API key: it goes in the
  `X-Api-Key` header of every API call. The password (user `admin`) opens the dashboard and Swagger; you can see it
  again on the app's page under **Saved passwords**, after typing your Harbor password.
- Tells WAHA its main address (`WAHA_BASE_URL`), so file links in webhooks and API answers point at this app.
- Keeps Harbor's app login off for this app: its clients send only the API key, which a Harbor login page would block.

## Storage

- `sessions`: The linked WhatsApp session, its keys and settings (`/app/.sessions`). Lose it and the phone must be
  linked again.
- `media`: Files from received messages that WAHA downloads (`/app/.media`).
- Managed volumes are retained on remove; Harbor never deletes them.

## First run

1. Open WAHA. The browser asks for a login: user `admin` and the password shown after install. You land on
   Swagger, the API reference.
2. Click **Dashboard** at the top (or open `/dashboard`). Add this server: its URL is this app's address, the API
   key is the one shown after install. The dashboard keeps both in this browser only.
3. Start the session `default` and scan its QR code in WhatsApp on your phone: Settings → Linked devices → Link a
   device. The session stays linked across restarts and updates.
4. Send a test message from Swagger (`POST /api/sendText`, session `default`, chatId `<number>@c.us`) or set a
   webhook on the session (for example an n8n Webhook node's URL) to receive messages.

For n8n, install the WAHA community node (`@devlikeapro/n8n-nodes-waha`) and give it this app's address and API key.

## Limits on Harbor

- **WAHA is not an official WhatsApp API.** It drives WhatsApp Web, which WhatsApp's terms do not allow for
  automation. Numbers that send bulk or unsolicited messages get banned. Use a number you can afford to lose, and
  prefer replying over messaging people first.
- **WAHA Core runs one session**, named `default`: one WhatsApp number per copy of the app (install the app again
  for a second number). Several sessions, the media S3/database storage and some advanced features are in WAHA Plus,
  a paid image this package does not use.
- The GOWS engine supports most of WAHA's API; a few endpoints only work with the WEBJS (browser) engine, which this
  package does not run. Check the engine table at https://waha.devlike.pro/docs/how-to/engines/ before relying on one.
- The phone must come online at least every two weeks, or WhatsApp unlinks the session.
- Webhooks go out from this machine: a webhook to another app on the same machine uses that app's LAN, Tailscale or
  domain address, not `localhost`.
- Anyone with the API key can read and send messages as your number. Keep it out of shared workflows and screenshots.

Upstream: https://waha.devlike.pro
