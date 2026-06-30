from dataclasses import dataclass
from pathlib import Path
import os


REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data"
DATABASE_PATH = DATA_DIR / "personalaiasisstant.db"


@dataclass(frozen=True)
class Settings:
    app_name: str = "PersonalAIAsisstant"
    ai_name: str = "IntelliText"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    frontend_origin: str = "http://127.0.0.1:3000"
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
    database_url: str = f"sqlite:///{DATABASE_PATH.as_posix()}"


settings = Settings()
