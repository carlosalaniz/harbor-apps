# Ollama

Get up and running with Kimi, GLM, MiniMax, DeepSeek, gpt-oss, Qwen, Gemma and other models.

Install Ollama once and let your other AI apps use it: models are downloaded once, into this app, and every app
that links to it shares them. Download and manage models from **Open WebUI for Ollama** (Admin Panel, Settings,
Models) or with `ollama pull` inside this app.

## Graphics card (GPU)

Ollama asks for Harbor's **gpu** permission (needs Harbor 0.34.0 or newer). The install review says what this
machine has:

- **NVIDIA card**: Ollama gets every NVIDIA card, but only when the NVIDIA container toolkit is installed. Without
  it, the review and the app page say so and Ollama runs on the CPU. Install the toolkit once (the commands are in
  the [Operator Guide, GPU (graphics cards)](https://github.com/carlosalaniz/harbor/blob/main/docs/OPERATOR_GUIDE.md#gpu-graphics-cards)),
  then **Restart** the app. Stop and Start alone do not pick it up.
- **Intel or AMD graphics**: Ollama gets `/dev/dri` and tries Vulkan; integrated graphics are allowed
  (`OLLAMA_IGPU_ENABLE=1`).
- **No card**: it runs on the CPU. Small models (1 to 4 billion parameters) are usable; larger ones are slow.

To check, ask a model something, then run `docker exec <ollama container> ollama ps` in the machine's terminal
(Settings, Advanced access; `docker ps` lists the containers): `100% GPU` under PROCESSOR means the card does the
work. The app's page also says *Graphics card: ... (in use)*.

## Settings

Change these on the app page (Settings, Change...) or with `harbor configure ollama --set <id>=<value>`
([Operator Guide, App settings](https://github.com/carlosalaniz/harbor/blob/main/docs/OPERATOR_GUIDE.md#app-settings-since-0340)).
They apply to every model this Ollama runs.

| Setting | id | Default | What it does |
|---|---|---|---|
| Context length (tokens) | `context-length` | 8192 | How much text a model keeps in mind. 0 lets Ollama choose from the graphics memory (4k, 32k or 256k). |
| Keep a model loaded for | `keep-alive` | 5m | How long a model stays in memory after its last answer (`10m`, `24h`; `-1` forever, `0` unload at once). |
| Parallel requests per model | `num-parallel` | 1 | Answers one model works on at the same time; memory grows with context length times this. |
| Models loaded at once | `max-loaded-models` | 0 | 0 is automatic: 3 per graphics card, or 3 on the CPU. |
| Flash attention | `flash-attention` | Automatic | Less memory for long conversations. Automatic uses it where the hardware supports it; `1` forces it on, `0` off. |
| Conversation memory precision | `kv-cache` | Full (`f16`) | `q8_0` (half) or `q4_0` (a quarter) saves graphics memory with a small loss in quality; needs flash attention. |

On the command line, Automatic flash attention is the value `''` (two single quotes): `--set "flash-attention=''"`.
The defaults are what this package did before (context length 8192) or Ollama's own defaults.

## Other apps

Apps that can use a local model link to Ollama when you install them (*Talks privately to*): Open WebUI for Ollama,
AnythingLLM, Vane and Langflow. Harbor joins just the two apps on a private network and hands the other
app the address `http://ollama-link:11434`. Ollama is not restarted for that. Its own address (the app's page) also
works for programs on your network: anything that speaks the Ollama API, such as `OLLAMA_HOST=<address> ollama run`.

## Storage

- `data`: Downloaded models. You may point it at a folder of your own at install time (optional): models are large
  (1 to 40 GB each); a folder on a big disk is a good idea.

- Website: https://ollama.com/
- Source code: https://github.com/ollama/ollama
- Help: https://github.com/ollama/ollama/issues
