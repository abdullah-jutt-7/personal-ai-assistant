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
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm install
npm run dev
```

Backend runs on `http://127.0.0.1:8000`.
Frontend runs on `http://127.0.0.1:3000`.

## Notes

- The app is local-first.
- No Docker or external database server is required.
- Ollama must be available locally for chat to work.
- Memory uploads are stored locally in SQLite.
- Dataset support is planned and tracked in `AGENTS.md`.

