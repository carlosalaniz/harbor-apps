# Khoj

Khoj is an AI second brain: chat with your notes and documents, search the web, let it write and run code, and
schedule research that runs on its own. It works with local models through the Ollama app or with an API provider
(Anthropic, Google Gemini, OpenAI and other OpenAI-compatible services).

- Website: https://khoj.dev
- Source code: https://github.com/khoj-ai/khoj
- Help: https://docs.khoj.dev

## First start

The first start takes a few minutes: Khoj sets up its database and downloads its search models (a few hundred MB).
Then open Khoj and start chatting. There is no sign-in: this package runs Khoj in single-user mode, so anyone who can
reach its address can use it. Keep it on your home network or Tailscale, or put it behind a domain only if you accept
that.

## Chat models

Khoj sets up its chat models at its first start, from what you gave at install:

- **Ollama (local models).** Install the **Ollama** app first and let Khoj link to it at install (*Talks privately
  to*; it is optional). Khoj lists every model you downloaded in Ollama, and lists them again at every start: after
  you download a new model, restart Khoj. Linking Ollama later works too (restart Khoj afterwards).
- **Anthropic or Google Gemini.** Type their API keys at install. Khoj reads them at its first start only.
- **Anything else, or keys you get later** (OpenAI, another OpenAI-compatible service): add them in Khoj's admin
  panel at `/server/admin`: an *AI Model API* (name, key, and for a service other than OpenAI its address), then a
  *Chat Model* for each model you want. Sign in with the admin login Harbor shows once after install.

Pick the model you chat with in Khoj's own settings.

## What runs

- **Khoj**, with its database (PostgreSQL with pgvector). Harbor generates the database password and Khoj's secret key,
  and creates the admin account for the admin panel.
- **Terrarium**, the sandbox where Khoj runs the Python code it writes (calculations, charts).
- **SearXNG**, Khoj's private web search.
- **A small proxy** in front of Khoj, so the admin panel works at every address Harbor gives Khoj (localhost, the home
  network, the secure home-network address, Tailscale or a domain). It also hands Khoj the Ollama link at the address
  Khoj expects.

Telemetry is off. Khoj's optional "computer use" (operator) feature is not included: it needs access to Docker.

## Storage

- `db`: chats, indexed notes and documents, model and server settings.
- `config`: Khoj's own folder.
- `models`: the search models Khoj downloads at its first start (kept so later starts are fast).
- `search`: SearXNG's settings.
- Managed volumes are retained on remove; Harbor never deletes them.
