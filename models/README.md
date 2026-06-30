# Bundled Ollama Models

This folder is the local Ollama model store used by IntelliText packaging.

The packaging flow copies `models/` into `dist/preview/models`, and the launch/bootstrap scripts point Ollama at that local directory when it exists.

Packaged models:
- `deepseek-r1:1.5b`
- `qwen3:1.7b`

Keep the manifests and blobs together so the installer can run the app from the installed directory without re-downloading model weights.
