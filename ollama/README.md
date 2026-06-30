# Bundled Ollama Runtime

Place the app-local Ollama runtime files in this folder when packaging IntelliText.

Expected installer layout:
- `ollama/ollama.exe`
- any required Ollama support files beside it

The launch script prefers this local runtime over any system-wide Ollama install so the packaged app always starts the correct copy from the install directory.
