from backend.app.db.session import Base, engine, ensure_data_dir
from backend.app.models import entities  # noqa: F401


def init_db() -> None:
    ensure_data_dir()
    Base.metadata.create_all(bind=engine)

