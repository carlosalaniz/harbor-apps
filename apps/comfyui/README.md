# ComfyUI

Make images with Stable Diffusion, FLUX and other open models on this machine's graphics card, in a node editor or
from Open WebUI.

ComfyUI builds images from a graph of steps (load a model, describe the picture, sample, save). Start from a
template, or let **Open WebUI** send its prompts here so you can make images inside a chat.

This package uses the community image [`yanwk/comfyui-boot`](https://github.com/YanWenKun/ComfyUI-Docker)
(`cu130-slim-v2`, CUDA 13.0): the official ComfyUI release plus **ComfyUI-Manager**. Comfy Org publishes no image of
its own.

## No accounts: keep it private

ComfyUI has no login. Anyone who can open its address can make images, download models and install custom nodes
(code that runs in this app). Keep it on this machine, your network or your tailnet. If you give it a public domain,
keep the basic-auth protection Harbor puts in front of it by default.

## Graphics card (GPU)

ComfyUI asks for Harbor's **gpu** permission (needs Harbor 0.34.0 or newer). The install review says what this
machine has:

- **NVIDIA card**: ComfyUI gets every NVIDIA card when the NVIDIA container toolkit is installed (commands in the
  [Operator Guide, GPU (graphics cards)](https://github.com/carlosalaniz/harbor/blob/main/docs/OPERATOR_GUIDE.md#gpu-graphics-cards)),
  then **Restart** the app. This image needs **driver 580 or newer** (CUDA 13); `nvidia-smi` shows the version.
  Cards from the GTX 16 and RTX 20 series on work; 8 GB of graphics memory is enough for SDXL, FLUX wants 12 GB or
  more.
- **No usable card** (no NVIDIA card, no toolkit, an older driver; Intel and AMD are not used): ComfyUI starts on
  the CPU instead. That works, but an image takes minutes instead of seconds.

The app's page says *Graphics card: ... (in use)* when the card is handed to ComfyUI. ComfyUI's log names the card
it uses at start (`Device: cuda:0 NVIDIA ...`, or `Device: cpu`).

## First images

1. Open ComfyUI. Click **Manager**, then **Model Manager**, search for `sdxl`, and install **SDXL base**
   (`sd_xl_base_1.0.safetensors`, about 7 GB, saved as `checkpoints/SDXL`). Wait for the download to finish, then
   press **R** to reload the model lists.
2. Open the templates (**Templates** in the left sidebar), pick an image template (for example *Image Generation*),
   choose the model in the *Load Checkpoint* node, type a prompt and click **Run**. The picture shows in the
   *Save Image* node and is kept in `output`.

Models can also come from any template: the template names what it needs.

## Make images from Open WebUI

**Open WebUI** and **Open WebUI for Ollama** can link to ComfyUI. Harbor joins just the two apps on a private
network and hands Open WebUI the address `http://comfyui-link:8188`. ComfyUI is not restarted for that.

**Open WebUI installed after ComfyUI.** In Open WebUI's install dialog, under *Talks privately to*, pick ComfyUI
for *ComfyUI, to make images in chats* (it is optional, so it starts at *None for now*; CLI:
`--link comfyui=comfyui`). Open WebUI then starts with the address and the node map of its built-in workflow filled
in, 1024x1024 pictures and 25 steps. In Open WebUI, **Admin Panel**, **Settings**, **Images**:

1. Turn on **Image Generation**, pick **ComfyUI** as the engine.
2. Pick the model, for example `SDXL/sd_xl_base_1.0.safetensors`, and save.
3. In a chat, click **Image** under the message box and send a prompt.

**Open WebUI installed before ComfyUI.** Link it on Open WebUI's app page (*Links*, pick ComfyUI, **Link**) or with
`harbor configure <open-webui app> --link comfyui=comfyui`. Open WebUI keeps its settings in its own database from
its first start, so fill in the rest yourself under **Images**: engine **ComfyUI**, base URL
`http://comfyui-link:8188`, then the *ComfyUI Workflow Nodes* of the built-in workflow:

| Field | Node ID |
|---|---|
| Prompt (`text`) | `6` |
| Model (`ckpt_name`) | `4` |
| Width, Height | `5` |
| Steps, Seed | `3` |

Then pick the model, set the size to `1024x1024` and the steps to `25` (SDXL), save, and make an image as above.

The built-in workflow is a plain checkpoint workflow: it suits SD 1.5 and SDXL checkpoints. For FLUX and other
models, export your workflow in ComfyUI (**Workflow**, **Export (API)**), paste it under *ComfyUI Workflow* and map
its nodes ([Open WebUI's guide](https://docs.openwebui.com/features/image-generation-and-editing/comfyui)).

**Sharing the card.** ComfyUI and Ollama use the same graphics memory. While Ollama keeps a large model loaded,
ComfyUI moves parts of its model in and out and gets slower (on a 24 GB card next to a 16 GB chat model: about
2 steps per second for SDXL). Ollama's *Keep a model loaded for* setting frees the memory sooner.

## Storage

- `models`: Downloaded models. You may point it at a folder of your own at install time (optional): a folder on a
  big disk is a good idea. Backups include it.
- `output`: Images and videos you made. `input`: images you uploaded.
- `user`: Saved workflows, ComfyUI and Manager settings.
- `custom-nodes`, `python`: Custom nodes installed with the Manager and the Python packages they need. An update of
  this app keeps them; a custom node that breaks after one can be updated or turned off in the Manager.
- `cache`: Models some custom nodes download on their own (Hugging Face, torch hub).

ComfyUI itself is not kept: every update brings the ComfyUI in the new image. Update ComfyUI through Harbor
(Updates), not with the Manager's *Update ComfyUI*.

- Website: https://www.comfy.org/
- Source code: https://github.com/Comfy-Org/ComfyUI
- Image: https://github.com/YanWenKun/ComfyUI-Docker
- Help: https://github.com/Comfy-Org/ComfyUI/issues
