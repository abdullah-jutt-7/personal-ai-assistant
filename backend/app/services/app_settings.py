from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.entities import AppMetadata


OLLAMA_MODEL_KEY = "ollama_model"


def get_metadata_value(db: Session, key: str, default: str = "") -> str:
    record = db.scalar(select(AppMetadata).where(AppMetadata.key == key))
    if record is None:
        return default
    return record.value


def set_metadata_value(db: Session, key: str, value: str) -> None:
    record = db.scalar(select(AppMetadata).where(AppMetadata.key == key))
    if record is None:
        record = AppMetadata(key=key, value=value)
        db.add(record)
    else:
        record.value = value


def get_active_ollama_model(db: Session) -> str:
    stored = get_metadata_value(db, OLLAMA_MODEL_KEY, "")
    return stored.strip() or settings.ollama_model


def set_active_ollama_model(db: Session, model_name: str) -> str:
    normalized = model_name.strip()
    if not normalized:
        normalized = settings.ollama_model
    set_metadata_value(db, OLLAMA_MODEL_KEY, normalized)
    db.commit()
    return normalized
