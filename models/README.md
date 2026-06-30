# Bundled Ollama Models

Put the preseeded Ollama model store for IntelliText in this folder before running the packaging scripts.

The packaging flow copies `models/` into `dist/preview/models`, and the launch/bootstrap scripts point Ollama at that local directory when it exists.

Target packaged models:
- `deepseek-r1:1.5b`
- `phi3.5`

This folder is intentionally empty in source control until we have the model assets staged locally.
