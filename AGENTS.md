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
- Memory injection should stay bounded and source-aware so it helps without overwhelming the model prompt.

Dataset flow:
- Store datasets locally in a dedicated folder and track them in SQLite metadata.
- Support dataset import, export, and versioning later if needed.
- Keep datasets separate from runtime chat history and user memory.
- Design the data model so future fine-tuning or retrieval workflows can use the same stored sources.
- Dataset imports should create local files, metadata rows, and a visible dataset list in the UI.
- Dataset chunks should be used as bounded prompt-time context when relevant.
- Dataset management UI should support removing imported datasets and cleaning up their stored files.
- Dataset management UI should also support a read-only details view with sources, versions, and chunk previews.
- Dataset management UI should also support editing the dataset name and description without re-importing the files.

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
- Use a full-screen shell with a left sidebar that starts at the very edge and a main chat area that flexes to fill the remaining width.
- On larger screens, the layout should scale up naturally instead of staying boxed in a narrow centered container.
- On very large displays, typography, spacing, cards, and chat bubbles should feel proportionally larger and more spacious.
- On viewports narrower than 980px, the sidebar should collapse into a drawer/overlay pattern so the chat area stays usable.
- Sidebar for chats, memory, and settings.
- Chat area must feel fast and uncluttered.
- The document itself must not scroll during normal chat use; the conversation pane owns the scroll area.
- The composer must send on Enter and allow Shift+Enter for line breaks.
- The conversation pane should auto-scroll to the latest assistant/user message during normal chat flow.
- User memory upload should be easy to find and easy to understand.
- Include a clear model/status area in the header.
- For the final-year demo, support an expandable reasoning/thinking view so we can show what the model is doing without cluttering the main chat.
- Assistant responses should render rich markdown with styled headings, paragraphs, lists, inline code, tables, and highlighted code blocks.
- Memory management UI should allow viewing and deleting uploaded memory sources.
- Memory management UI should also support a read-only details view with chunks and file metadata.
- Memory management UI should also support editing the memory title and content text.
- Support both dark mode and light mode from the start.
- Include a theme toggle that remembers the user's preference locally.
- Stream assistant responses live into the chat bubble instead of waiting for the full completion.
- The current design priority is a minimal, uncluttered, premium interface; reduce card clutter and dense UI chrome where possible.

Design direction:
- Inspired by premium AI apps such as ChatGPT and You.com, but not copied exactly.
- Left sidebar for navigation and history, main chat panel stretching across the remaining viewport, and a calm top status bar.
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
- [x] Inject memory into prompts.

### Stage 2b - Datasets
- [x] Define local dataset storage structure.
- [x] Add dataset import and metadata tracking.
- [x] Support dataset versioning groundwork.
- [x] Prepare dataset flow for future training or retrieval use.
- [x] Add dataset delete/cleanup workflow.
- [x] Add dataset details inspection flow.

### Stage 3 - Installer
- [ ] Bundle app runtime.
- [ ] Bundle or provision Ollama.
- [ ] Package model files.
- [ ] Create Windows installer.
- [ ] Verify first-run experience.

### Stage 4 - Polish
- [x] Improve visuals and motion.
- [x] Add settings and model selection.
- [x] Add theme persistence in local settings.
- [x] Add installed Ollama model discovery and refresh.
- [x] Add dark and light mode theme toggle.
- [x] Add memory management UI.
- [x] Add conversation rename and delete controls.
- [x] Add sidebar conversation search.
- [ ] Add startup and tray behavior if desired.
- [x] Add full-screen responsive shell that fills the viewport and scales on larger displays.
- [x] Add compact sidebar breakpoint behavior for narrower screens.
- [x] Keep chat scrolling inside the conversation pane instead of scrolling the whole page.
- [x] Support Enter-to-send in the composer.
- [x] Render assistant markdown with richer typography and syntax-highlighted code blocks.
- [x] Auto-scroll the conversation pane to the latest message during normal chat flow.
- [x] Add a visible local dataset import/list flow in the sidebar.
- [x] Use dataset chunks as bounded prompt-time context.
- [x] Add delete controls for imported datasets.
- [x] Add dataset details panel for inspection.
- [x] Add dataset editing workflow.
- [x] Add memory source list and delete controls.
- [x] Add memory details inspection flow.
- [x] Add memory editing workflow.

## Working Rules

- Keep the app local-first.
- Prefer simple, reliable solutions over clever ones.
- Do not require the user to create accounts.
- Do not assume internet access after install.
- Do not make the user configure a database manually.
- Keep code modular and easy to package.
- Keep the frontend and backend broken into feature-based modules and reusable components; avoid large monolithic files except for short-lived scaffolds.
- Prefer small components for sidebar, chat header, theme toggle, message list, composer, memory upload, and status badges.
- If a decision affects installer size, offline support, or user setup, treat it as a product decision, not just a code decision.

## Current Status

Repo status:
- Old implementation removed.
- Initial Python backend and Next.js frontend scaffold are in place.
- Live streamed chat responses are now implemented.
- Dark and light mode theming is now implemented.
- Full-screen responsive layout scaling is now implemented.
- Compact sidebar drawer behavior on small screens is now implemented.
- Frontend is now split into reusable feature components for sidebar, header, message list, composer, and thinking panel.
- Chat scrolling is now constrained to the conversation pane, and Enter-to-send is supported.
- Assistant responses now render richer markdown and styled code blocks.
- The conversation pane now auto-scrolls to the latest message during normal chat flow.
- Uploaded memory now influences future prompts through a bounded local-memory system prompt section.
- Uploaded memory sources can now be listed and deleted from the sidebar.
- Uploaded memory sources can now be inspected through a details panel showing file metadata and chunk previews.
- Uploaded memory sources can now be edited from the details panel and re-chunked.
- Local dataset imports now create stored files and metadata entries, with a sidebar list of imported datasets.
- Imported datasets now contribute bounded prompt-time context chunks alongside memory.
- Imported datasets can now be deleted from the sidebar, which also cleans up their local storage folder.
- Imported datasets can now be inspected through a details panel showing sources, versions, and chunk previews.
- Imported datasets can now be renamed and re-described from the details panel.
- The active Ollama model can now be viewed and changed from the sidebar settings card.
- The sidebar model picker can now refresh from the installed Ollama model list.
- The UI theme can now be loaded from and saved to local settings.
- The app should still boot its UI even if the Ollama model inventory endpoint is temporarily unavailable.
- Chat conversations can now be renamed and deleted from the sidebar.
- The sidebar can now filter conversations by title.
- Keep iterating toward a cleaner, less cluttered visual language that feels closer to the minimal AI-app examples.
- This file now defines the working direction.

Immediate next step:
- Build the first end-to-end experience for memory injection and dataset management on top of the scaffold.
