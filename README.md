# PersonalAIAsisstant

IntelliText is the local AI assistant for this project.

## Stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Database: SQLite via SQLAlchemy 2.0 and Alembic
- Model runtime: Ollama

## Development

1. Create and activate a Python virtual environment.
2. Install Python dependencies.
3. Install frontend dependencies with npm.
4. Run the app with the root dev command.

### Example

```powershell
python -m venv .venv
--windows ".venv\Scripts\Activate.ps1"
-- macbook "source .venv/bin/activate"
pip install -r requirements.txt
npm install
npm run dev
```

Backend runs on `http://127.0.0.1:8000`.
Frontend runs on `http://127.0.0.1:3000`.

## Preview Package

If you want a local test package before the final installer work, use the preview flow:

```powershell
npm run preview:stop
npm run package:preview
npm run preview
```

This stops any previous preview processes, stages the standalone Next.js frontend plus the Python backend into `dist/preview`, and launches both locally.

The preview bundle now also creates a local Python virtual environment and copies `node.exe` into the staged folder so the packaged app can run from the bundle instead of depending on the build machine's runtimes.
The preview bundle also builds and stages the native `IntelliText.exe` WebView2 host plus its companion DLLs so the app opens like a desktop program instead of a script-driven launcher.
If a local `models` folder exists at the repo root, the preview bundle will copy it into `dist/preview/models` and the Ollama bootstrap script will prefer that local model store.
If a local `ollama` folder exists at the repo root, the preview bundle will copy it into `dist/preview/ollama` and the app will prefer that bundled Ollama runtime.
You can also build just the host shell with `npm run build:host` if you want to verify the Windows wrapper on its own.

## Installer Scaffold

The final Windows installer work has started. The current scaffold generates an Inno Setup script from the packaged preview bundle.

```powershell
npm run build:installer
```

If Inno Setup is installed, the script can compile the installer. If not, it will still generate the ready-to-build `.iss` file in `dist/installer`.

The installer template consumes the preview bundle directly, so the packaged output includes the local runtime pieces staged above.
Because the preview bundle now stages the WebView2 host exe, the generated installer shortcut and first-run launch both point at `IntelliText.exe` instead of the old PowerShell wrapper.

For the public installer path, the first launch will try to use a bundled local Ollama/model store first. The packaged model pair is `deepseek-r1:1.5b` and `qwen3:1.7b`, with `deepseek-r1:1.5b` as the default active model.
When the bundled Ollama runtime is present, the app uses its own local Ollama port instead of the system-wide default.

## Notes

- The app is local-first.
- No Docker or external database server is required.
- Ollama must be available locally for chat to work.
- Memory uploads are stored locally in SQLite.
- Dataset support is planned and tracked in `AGENTS.md`.
