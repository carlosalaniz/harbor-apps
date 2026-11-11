# KT Stores

KT Stores keeps separate, growing knowledge stores of your documents that any AI agent can discover and search through
MCP. Keep one store for software development, one for a diet, one for home maintenance. Each store has a description
and tags, so an agent picks the right one without searching everything.

- **Stores are folders of your files.** The files are the source of truth, and the search index can always be rebuilt
  from them.
- **Drop in files or whole folders.** Markdown, text, HTML, Word and PDFs with a text layer are indexed in the
  background. Anything else is kept and waits until KT Stores can read it.
- **Follow the progress** across every store in Activity. Indexing continues with the page closed, and after a restart.
- **Descriptions and tags are written for you.** A store that already has them gets a suggestion to review, and never
  an automatic change.
- **View your files in the browser:** PDFs, Markdown, Word previews, and the exact text agents read.
- **Search one store, or ask all of them** and see which stores the LLM picks and why.
- **Chat with any OpenRouter model** about your stores. It uses the same tools agents get, so you can compare how well
  models find answers, with each answer's tool calls, time and cost.
- **Deleted items stay in the Trash for 30 days,** including ones deleted by agents.

## Getting started

1. Open KT Stores with the password Harbor shows after install.
2. In **Settings**, add an [OpenRouter](https://openrouter.ai/keys) API key.
3. Make a store and drop your documents in.

The text of your files is sent to OpenRouter for embedding and classification. Files whose names suggest secrets are
skipped unless you choose **Index anyway**.

## Connect an agent

Harbor shows two MCP tokens once, right after install: **full access** can do everything you can, and **read-only** can
list, search and read. Add this to any MCP client, using this app's MCP address from Harbor:

```json
{
  "mcpServers": {
    "kt-stores": {
      "type": "http",
      "url": "https://<this app's MCP address>/mcp",
      "headers": { "Authorization": "Bearer <your token>" }
    }
  }
}
```
