# AnythingLLM

All-in-one AI workspace: chat with your documents, build agents and connect any model provider, including a local Ollama.

## What Harbor does

- Runs the AnythingLLM server on 127.0.0.1 with its storage in a retained volume.
- Generates the three signing secrets once and keeps them as retained secrets.
- With the optional Ollama link, joins a private network with just Ollama's server and hands its address to
  AnythingLLM (`OLLAMA_BASE_PATH`).

## Storage

- `storage`: Documents, vector database, users and settings.
- Managed volumes and your folders are retained on remove; Harbor never deletes them.

## First run

1. Open the app and complete onboarding: choose a model provider and an embedding provider.
2. For local models, install the **Ollama** app first and let AnythingLLM link to it at install (*Talks privately
   to*; it is optional). Then pick Ollama as the LLM provider in the onboarding: the address
   (`http://ollama-link:11434`) is already filled in, and the models you downloaded in Ollama are listed. Or use an
   API provider.
3. Create a workspace, upload documents, chat.

## Notes

- **Choose the Ollama link at install.** AnythingLLM keeps the provider choices and API keys you enter in its
  settings (LLM provider, model, embedder, vector database) in a file inside its container, not in the `storage`
  volume, and Harbor's package format cannot keep that file yet. Whenever the container is recreated, that file
  goes back to the image's defaults and you choose the provider again: linking or unlinking Ollama later on the
  app page, a Restart and an update all recreate it. Your workspaces, documents, chats and users are in `storage`
  and stay.
- Multi-user mode can be enabled in the app settings once you publish it.

Upstream: https://anythingllm.com
