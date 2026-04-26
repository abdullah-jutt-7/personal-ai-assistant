from sqlalchemy import inspect, text

from backend.app.db.session import Base, engine, ensure_data_dir
from backend.app.models import entities  # noqa: F401


def init_db() -> None:
    ensure_data_dir()
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    message_columns = {column["name"] for column in inspector.get_columns("messages")}

    with engine.begin() as connection:
        if "reasoning_text" not in message_columns:
            connection.execute(text("ALTER TABLE messages ADD COLUMN reasoning_text TEXT"))
        if "reasoning_seconds" not in message_columns:
            connection.execute(text("ALTER TABLE messages ADD COLUMN reasoning_seconds INTEGER"))
