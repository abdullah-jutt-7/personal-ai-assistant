# PersonalAIAsisstant

Assistant name: IntelliText

This file is the source of truth for the project. Read it first in every new session, and keep it updated as the architecture changes.

## Vision

Build a Windows-first local AI assistant that a normal user can install and use immediately.

Goals:
- One installer file.
- No account required.
- No manual model download.
- No manual database setup.
- Works offline after install.
- Beautiful, polished chat interface comparable to modern AI assistants.
- Supports user personalization through local file upload.
- Supports local datasets for future training, import, export, and knowledge management.

## Product Direction

We are rebuilding from scratch with a clean local-app architecture.

Chosen stack:
- UI: Next.js + TypeScript + Tailwind CSS
- Backend/runtime: Python
- Web API: FastAPI
- ORM: SQLAlchemy 2.0
- Migrations: Alembic
- Local database: SQLite
- Model runtime: Ollama
- Default model: qwen3:4b

Why this stack:
- Next.js gives us a strong foundation for a polished AI-style interface.
- TypeScript keeps the UI codebase safer and easier to maintain as it grows.
- Tailwind CSS helps us build a highly intentional, premium-looking interface quickly.
- Python gives us the strongest AI, text processing, dataset, and file-handling ecosystem.
- FastAPI keeps the backend clean, fast, and easy to package.
- SQLAlchemy plus Alembic gives us a standard schema and migration workflow without requiring Node or Prisma.
- SQLite is the easiest reliable local database for a single-user offline Windows app.
- Ollama handles local model inference, so we do not need to ship Python ML code.
- `qwen3:4b` is the default model because it is a good balance of quality, chat ability, coding help, and local footprint.

## Important Distribution Rule

Users must not need to install Docker, PostgreSQL, MySQL, Node, or any other extra platform service separately.

How that works:
- Python is the developer/runtime language for the app codebase, but the final Windows installer can bundle the Python runtime so end users do not need to install Python manually.
- The final installer ships with the app runtime and UI packaged locally.
- The installer can also bundle Ollama and the model files, or download them during install if needed.
- The app should launch from the installer or a desktop shortcut without extra setup.

Developer setup rule:
- A fresh GitHub clone should be runnable with a small set of normal commands.
- No Docker.
- No separate database server.
- Prefer `python -m venv`, `pip install -r requirements.txt`, `npm install`, and one app start command per side if we keep the frontend and backend split during development.
- If we add helper scripts, they must reduce setup, not increase it.
- Supported development Python versions are 3.12 or 3.13. Do not use Python 3.14 for now because some native packages in the stack may not have wheels for it yet.

## Core Architecture

Request flow:
1. User types a message in the UI.
2. The app saves the message to SQLite.
3. The app builds context from chat history and user memory.
4. The app sends the prompt to Ollama on localhost.
5. Ollama returns the model response.
6. The app stores the response in SQLite.
7. The UI renders the answer.

Memory flow:
- User uploads a `.txt` file or similar local document.
- The app parses the file into persistent local memory.
- Memory is stored in SQLite.
- Memory is injected into the prompt on future chats.
- This is not retraining; it is persistent local context.

Dataset flow:
- Store datasets locally in a dedicated folder and track them in SQLite metadata.
- Support dataset import, export, and versioning later if needed.
- Keep datasets separate from runtime chat history and user memory.
- Design the data model so future fine-tuning or retrieval workflows can use the same stored sources.

## Interface Requirements

The UI must feel premium, calm, and intentional.

Requirements:
- Strong visual hierarchy.
- Clear chat layout.
- Excellent spacing and typography.
- Smooth, useful animations only.
- No generic boilerplate look.
- No default AI-app sameness.
- Works well on desktop and tablet-sized windows.
- Sidebar for chats, memory, and settings.
- Chat area must feel fast and uncluttered.
- User memory upload should be easy to find and easy to understand.
- Include a clear model/status area in the header.
- For the final-year demo, support an expandable reasoning/thinking view so we can show what the model is doing without cluttering the main chat.
- Support both dark mode and light mode from the start.
- Include a theme toggle that remembers the user's preference locally.
- Stream assistant responses live into the chat bubble instead of waiting for the full completion.

Design direction:
- Inspired by premium AI apps such as ChatGPT and You.com, but not copied exactly.
- Left sidebar for navigation and history, centered main chat panel, and a calm top status bar.
- Rounded cards, thin borders, subtle gradients, and soft shadows.
- Dark mode should feel rich and cinematic.
- Light mode should feel clean, airy, and equally polished.
- A real product feel, not a demo shell.

## Data Model

Use SQLite tables for:
- conversations
- messages
- user_settings
- memory_sources
- memory_chunks
- datasets
- dataset_sources
- dataset_versions
- app_metadata

SQLAlchemy should own the model definitions and Alembic should own migrations.

## Offline Install Expectations

The final installer should support:
- first-run setup without internet, if the model is bundled
- local database creation automatically
- local Ollama availability automatically
- local app startup automatically

If the model is too large to embed directly in the installer, a first-launch offline-friendly extraction flow is acceptable, but the user should still not manually configure anything.

## User Memory Feature

Users must be able to upload a text file to personalize the assistant.

Supported behavior:
- Accept `.txt` first.
- Store uploaded content locally.
- Convert file content into persistent memory.
- Allow the user to review memory before saving if needed.
- Use that memory in future prompts.
- Allow editing/removal later.

Recommended future enhancement:
- Add semantic retrieval over uploaded content.
- Keep the basic version simple and reliable first.

## Build Strategy

We will implement the project in stages.

### Stage 0 - Foundation
- [x] Reset the old repo content.
- [x] Scaffold the new app structure.
- [x] Add Python environment and dependency setup.
- [x] Add SQLAlchemy models, Alembic migrations, and SQLite config.
- [x] Add Next.js + TypeScript + Tailwind frontend scaffold.
- [x] Add Ollama integration layer.
- [x] Add the polished chat UI shell.

### Stage 1 - Core Chat
- [x] Send messages from UI to backend.
- [x] Store chat history locally.
- [x] Call Ollama and render responses.
- [x] Support multiple conversations.
- [x] Stream assistant responses live into the chat bubble.

### Stage 2 - Memory
- [x] Add file upload.
- [x] Parse `.txt` memory files.
- [x] Save memory locally.
- [ ] Inject memory into prompts.

### Stage 2b - Datasets
- [ ] Define local dataset storage structure.
- [ ] Add dataset import and metadata tracking.
- [ ] Support dataset versioning groundwork.
- [ ] Prepare dataset flow for future training or retrieval use.

### Stage 3 - Installer
- [ ] Bundle app runtime.
- [ ] Bundle or provision Ollama.
- [ ] Package model files.
- [ ] Create Windows installer.
- [ ] Verify first-run experience.

### Stage 4 - Polish
- [ ] Improve visuals and motion.
- [ ] Add settings and model selection.
- [ ] Add memory management UI.
- [ ] Add startup and tray behavior if desired.

## Working Rules

- Keep the app local-first.
- Prefer simple, reliable solutions over clever ones.
- Do not require the user to create accounts.
- Do not assume internet access after install.
- Do not make the user configure a database manually.
- Keep code modular and easy to package.
- If a decision affects installer size, offline support, or user setup, treat it as a product decision, not just a code decision.

## Current Status

Repo status:
- Old implementation removed.
- Initial Python backend and Next.js frontend scaffold are in place.
- Live streamed chat responses are now implemented.
- This file now defines the working direction.

Immediate next step:
- Build the first end-to-end experience for memory injection and dataset management on top of the scaffold.
