# Ghostfolio

Track your stocks, ETFs and crypto in one private dashboard: net worth, allocation, performance and dividends, with free market prices from Yahoo Finance and CoinGecko.

## What Harbor does

- Runs Ghostfolio, PostgreSQL 15 and Redis on a private network; only Ghostfolio's web page is published on 127.0.0.1.
- Generates the database password, the token salt and the session signing key once and keeps them as retained secrets.
- Hands Ghostfolio its main address (`ROOT_URL`), which it uses for fingerprint sign-in and link previews; Harbor writes it again when the main address changes.
- Switches off Prisma's usage telemetry and npm's version check: every start runs the database migrations through them, and neither phones home.

## Storage

- `db-data`: the PostgreSQL database: your accounts, activities, settings and the market data Ghostfolio has fetched.
- Redis only holds a cache and the queue of price jobs; it is never saved, and Ghostfolio refills it.
- The managed volume is retained on remove; Harbor never deletes it.

## First run

1. Open Ghostfolio and press **Get Started**. The first account becomes the administrator.
2. Press **Create Account**, tick the box (you understand a lost token cannot be recovered) and press **Continue**. The account exists from that moment. Ghostfolio signs you in with a **security token**, not a password, and shows it only now: press **Copy to clipboard**, save it in your password manager, then press **Create Account** to sign in. Without it you cannot sign in again.
   If the page closes before you saved the first token, that administrator is out of reach and later sign-ups only become plain users. Use **Uninstall completely** (`harbor purge`) and install again: a plain Remove keeps the database, and the unreachable administrator with it.
3. Turn off new sign-ups: **Admin Control → Overview → User Signup**. Until you do, anyone who can open the page can create an account.
4. Add your accounts and your buys, sells and dividends (by hand, or import a CSV or JSON file on the Activities page).

## Notes

- Prices come from Yahoo Finance and CoinGecko over the internet, without an API key. Those free sources sometimes slow down or break for a while; that shows up as missing prices, not as an error in Harbor.
- Other outside services fill in the details: logos come through Google's favicon service, ETF details from Trackinsight, and stock and ETF identifiers from OpenFIGI. They, like Yahoo Finance and CoinGecko, see the symbols and companies you track; Ghostfolio has no switch for them. Your portfolio itself (quantities, accounts, activities) stays in the local database.
- Signing in from another device needs the same security token.
- Fingerprint sign-in (Settings, Biometric Authentication) works only on the app's main address over HTTPS (secure LAN, Tailscale or a domain). On any other address, plain-http LAN or an IP address, sign in with the security token.
- Publish it on your tailnet rather than a public domain unless you have turned sign-ups off.
- Ghostfolio is released almost every day; Harbor's catalog follows the new versions on its own.
- PostgreSQL stays on version 15 (Harbor does not move a database to a new major version).

- Website: https://ghostfol.io
- Source code: https://github.com/ghostfolio/ghostfolio
- Self-hosting FAQ: https://ghostfol.io/en/faq/self-hosting
