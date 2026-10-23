# Open WebUI

Private ChatGPT-style assistant with a bundled Ollama model server. Chat with local models on this machine or connect your own API keys.

## What Harbor does

- Runs Open WebUI and an Ollama server on a private network; only the web UI is published on 127.0.0.1.
- Generates the session signing key once and keeps it as a retained secret.
- Hands the current address to Open WebUI (WEBUI_URL) and re-renders it when you publish the app.

## Storage

- `data`: Chats, users and settings.
- `models`: Downloaded Ollama models. You may point this at a folder of your own at install time (optional): Models are large (1 to 40 GB each); a folder on a big disk is a good idea.
- Managed volumes and your folders are retained on remove; Harbor never deletes them.

## First run

1. Open the app and create the first account; it becomes the administrator. Further sign-ups wait for admin approval.
2. Pull a model (Settings, Models) or add an API key (Settings, Connections). Small models such as llama3.2:1b work on CPU; larger ones need RAM.
3. Optionally publish it on your tailnet or a public hostname from the Publishing page.

## Notes

- The bundled Ollama uses the graphics card when Harbor finds one (Harbor 0.34.0 or newer): an NVIDIA card with
  the NVIDIA container toolkit, or Intel/AMD graphics. Without one it runs on the CPU; expect slow answers with
  large models. For NVIDIA, install the toolkit once (see the
  [Operator Guide, GPU (graphics cards)](https://github.com/carlosalaniz/harbor/blob/main/docs/OPERATOR_GUIDE.md#gpu-graphics-cards))
  and Restart the app.
- Its models belong to this app. To download models once and share them with other AI apps, install the separate
  **Ollama** app and **Open WebUI for Ollama** instead.
- Nothing leaves this machine unless you add an external API key.

Upstream: https://openwebui.com
