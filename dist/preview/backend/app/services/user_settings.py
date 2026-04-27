from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.entities import UserSetting


def get_setting_value(db: Session, key: str, default: str = "") -> str:
    record = db.scalar(select(UserSetting).where(UserSetting.key == key))
    if record is None:
        return default
    return record.value


def set_setting_value(db: Session, key: str, value: str) -> None:
    record = db.scalar(select(UserSetting).where(UserSetting.key == key))
    if record is None:
        record = UserSetting(key=key, value=value)
        db.add(record)
    else:
        record.value = value


def get_theme_setting(db: Session, default: str = "dark") -> str:
    stored = get_setting_value(db, "theme", default)
    return stored.strip() or default


def set_theme_setting(db: Session, theme: str) -> str:
    normalized = theme.strip().lower()
    if normalized not in {"dark", "light"}:
        normalized = "dark"
    set_setting_value(db, "theme", normalized)
    db.commit()
    return normalized
