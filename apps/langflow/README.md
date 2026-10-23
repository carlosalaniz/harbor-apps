# Langflow

Langflow is a powerful tool for building and deploying AI-powered agents and workflows.

## Local models

Install the **Ollama** app first and let Langflow link to it at install (*Talks privately to*; optional). Langflow
then knows Ollama's address (`http://ollama-link:11434`, in `OLLAMA_BASE_URL`): choose Ollama as the provider in a
Language Model or Embedding Model component and pick one of the models you downloaded in Ollama. In the older
Ollama component, type that address as the Ollama API URL. Langflow's SSRF protection stays on; only the
`ollama-link` host is allowed (`LANGFLOW_SSRF_ALLOWED_HOSTS`).

- Website: https://www.langflow.org/
- Source code: https://github.com/langflow-ai/langflow
- Help: https://github.com/langflow-ai/langflow/issues
