# Karakeep

Save links, notes, images and PDFs in one place. Karakeep keeps a copy of every page, makes it all searchable and can tag it for you with a local AI model.

Karakeep (formerly Hoarder) is a "save it for later" app. Paste a link and it fetches the page with its own
headless Chrome: title, preview image, the readable text, a screenshot and, if you want, a full archive of the
page. Notes, images and PDFs work the same way, and their text becomes searchable too. Lists, tags,
highlights, RSS feeds and rules help you sort it all, and there are browser extensions and mobile apps for
saving in one tap.

## What Harbor does

- Runs the Karakeep app (web page and background workers in one container), its headless Chrome and a
  Meilisearch search server on a private network; only the web page is published on 127.0.0.1.
- Generates the login signing secret and the Meilisearch key once and keeps them as retained secrets.
- Hands Karakeep its main address (NEXTAUTH_URL) and updates it when the main address changes (Make primary,
  or Restart after a network change). Publishing an extra Tailscale or domain address leaves it as it is.
- Optionally links Karakeep to an installed **Ollama** app for automatic tags and summaries.

## First run

1. Open Karakeep and sign up. The first account becomes the administrator.
2. Save your first link. The page copy, screenshot and search entry appear after a few seconds, once the
   crawler has fetched it.
3. For the browser extension or the mobile app, publish the app (tailnet recommended), then enter its
   address as the server in the extension or app and sign in.

## AI tagging (optional)

Karakeep can suggest tags and write summaries with a local model through Ollama:

1. Install the Ollama app, then pick it as the `ollama` link when you install Karakeep (or later on
   Karakeep's app page).
2. Download the model Karakeep asks for, `gemma3:4b` (about 3.3 GB). Ollama has no web page, so use its API
   from Harbor's terminal (Settings, Advanced access) over the machine's own loopback address, which works
   whatever Ollama's main address is: `docker ps | grep 11434` shows Ollama's port on this machine (the
   number before `->11434`), then run
   `curl http://127.0.0.1:<that port>/api/pull -d '{"model": "gemma3:4b"}'`.
   A model pulled in Open WebUI does not count: Open WebUI has its own Ollama inside it.
3. New bookmarks get tags by themselves. For older ones, use Admin, Background jobs.

On a CPU a tag takes from a few seconds to a minute per bookmark. While it tags, Ollama holds the model in
about 4 GB of memory, on top of Karakeep's own (it lets go five minutes after the last request). This
package does not take an OpenAI key.

## Storage

- `data`: Bookmarks database (SQLite), page copies, screenshots and uploaded files. You may point this at a
  folder of your own at install time (optional); it grows with every page you save.
- `meilisearch`: Search index. If it is ever lost, rebuild it under Admin, Background jobs, Reindex all
  bookmarks. Bookmarks keep working while search is down.
- Managed volumes and your folders are retained on remove; Harbor never deletes them.

## Limits on Harbor

- Sign-up stays open after the first account (Karakeep only turns it off through a setting this package does
  not change). Anyone who can reach the address can create an account, so do not publish it on a public
  domain unless that is fine with you; LAN and tailnet are the safe places. The administrator can add and
  remove users under Admin, Users.
- When the main address is https (secure LAN, Tailscale or a domain), the login cookie is secure-only:
  sign in over an https address, not over the plain-http LAN address.
- The crawler refuses pages on private addresses (other apps on this machine, your LAN, your tailnet), so
  bookmarks of those are saved without a page copy.
- Fetching pages needs internet access, and so do some helpers on first use (ad-block lists, text
  recognition data).
- Headless Chrome needs about 1 GB of memory while it works.

## Links

- Website: https://karakeep.app
- Documentation: https://docs.karakeep.app
- Source code: https://github.com/karakeep-app/karakeep (AGPL-3.0)
- Help: https://github.com/karakeep-app/karakeep/issues
