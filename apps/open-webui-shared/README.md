# Open WebUI for Ollama

Private ChatGPT-style assistant for the separate Ollama app: chat with the models every AI app on this machine
shares, or connect your own API keys.

This is Open WebUI without a model server of its own. Install the **Ollama** app first: its models, its graphics
card and its settings (context length, keep-alive and so on) serve this app and every other AI app that links to
it, so each model is downloaded once. The **Open WebUI** app (with its own bundled Ollama) stays available and
unchanged.

## What Harbor does

- Runs Open WebUI on its own private network; only the web UI is published on 127.0.0.1.
- Links it to Ollama (*Talks privately to*): a private network joined only by this app and Ollama's server, with
  Ollama's address in `OLLAMA_BASE_URL` (`http://ollama-link:11434`). The link is required: with one Ollama
  installed Harbor picks it for you; with several you choose one; with none the install asks you to install Ollama
  first.
- Generates the session signing key once and keeps it as a retained secret.
- Hands the current address to Open WebUI (WEBUI_URL) and re-renders it when you publish the app.

## First run

1. Install Ollama, then this app. Open it and create the first account; it becomes the administrator. Further
   sign-ups wait for admin approval.
2. Download a model under Admin Panel, Settings, Models (for example `llama3.2:1b`). It lands in the Ollama app,
   where your other AI apps see it too. Per-model options (temperature, context, system prompt) are set here as
   well, under Workspace, Models.
3. Or add an API key under Admin Panel, Settings, Connections.

## Why the link is required

Open WebUI saves the Ollama address in its own database at its first start and keeps it after that, so the address
has to be there from the first start. Picking another Ollama later (app page, Links) needs nothing: the address
stays `http://ollama-link:11434`. If you only want API keys and no models on this machine, install the **Open
WebUI** app instead.

## Images (ComfyUI, optional)

Install the **ComfyUI** app first and pick it at install under *Talks privately to* (*ComfyUI, to make images in
chats*; it starts at *None for now*). Open WebUI then starts with the address `http://comfyui-link:8188` and the
node map of its built-in workflow filled in. Turn it on under Admin Panel, Settings, Images (engine ComfyUI, pick
a model such as `SDXL/sd_xl_base_1.0.safetensors`), then click Image under the message box in a chat. Linking
ComfyUI to an Open WebUI that already ran (app page, Links) needs the address and node IDs typed once: the ComfyUI
app's README has them.

## Storage

- `data`: Chats, users and settings. The models live in the Ollama app.
- Managed volumes and your folders are retained on remove; Harbor never deletes them.

## Notes

- How fast answers come depends on Ollama: on a graphics card Harbor found (see the Ollama app), or on the CPU.
- Nothing leaves this machine unless you add an external API key.

Upstream: https://openwebui.com
