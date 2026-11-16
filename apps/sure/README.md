# Sure

Your whole financial life in one private place: bank and investment accounts, transactions, budgets and net worth. Sure is the community-maintained successor of Maybe Finance.

## What Harbor does

- Runs Sure (web and a Sidekiq worker from the same image), PostgreSQL 16 and Redis on a private network; only Sure's web page is published on 127.0.0.1.
- Generates the database password and Rails' `SECRET_KEY_BASE` once and keeps them as retained secrets. `SECRET_KEY_BASE` also derives the keys that encrypt the credentials Sure stores, so it never changes.
- Hands Sure its main address (`APP_DOMAIN`, `WEBAUTHN_ALLOWED_ORIGINS`) for links in emails and for passkeys; Harbor writes it again when the main address changes.
- Turns off Sure's daily usage reporting to the project's PostHog (`POSTHOG_FEEDBACK_ENABLED=false`).
- Leaves HTTPS to Harbor (`RAILS_FORCE_SSL` and `RAILS_ASSUME_SSL` off): Sure works on plain-http LAN addresses and behind Harbor's HTTPS (secure LAN, Tailscale, a domain).

## Storage

- `db-data`: the PostgreSQL database: your accounts, transactions, budgets, rules and settings.
- `app-storage`: uploaded files (CSV imports, attachments, profile pictures), shared by web and worker.
- `redis-data`: the Sidekiq queue, kept on disk so queued imports and syncs survive a restart.
- The managed volumes are retained on remove; Harbor never deletes them.

## First run

1. Open Sure and press **Create your account**; enter an email and a password. The first account is the administrator.
2. Close sign-ups: **Settings → Self-Hosting → Onboarding**, choose **Closed** (or **Invite-only** to let family members join with a code). Until you do, anyone who can open the page can create an account.
3. Add accounts by hand or import a CSV (Mint, other apps, your bank's export).

## Notes

- Prices and exchange rates come from the provider you pick under **Settings → Self-Hosting** (Twelve Data by default, which needs a free API key). Without one Sure still works, but investments and foreign currencies have no live prices.
- Bank connections (SimpleFIN, Plaid, Enable Banking and others) and the AI assistant (OpenAI-compatible, Anthropic) are optional and set up in Sure's settings with your own keys. A local Ollama works as an OpenAI-compatible provider through its `/v1` address.
- Email is not configured: invitations are copied as links from **Settings**, not sent. Password reset by email does not work, so keep the administrator password in a password manager.
- Passkeys work only on the app's main address over HTTPS (secure LAN, Tailscale or a domain).
- Publish it on your tailnet rather than a public domain unless you have closed sign-ups.
- PostgreSQL stays on version 16 (Harbor does not move a database to a new major version).

- Website: https://sure.am
- Source code: https://github.com/we-promise/sure (AGPL-3.0)
- Self-hosting guide: https://github.com/we-promise/sure/blob/main/docs/hosting/docker.md
