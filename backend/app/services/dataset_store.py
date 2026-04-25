from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import shutil

from backend.app.core.config import DATA_DIR

DATASETS_DIR = DATA_DIR / "datasets"


def ensure_dataset_folder(dataset_id: int) -> Path:
    folder = DATASETS_DIR / f"dataset_{dataset_id}"
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def save_dataset_file(dataset_id: int, filename: str, content: bytes) -> Path:
    folder = ensure_dataset_folder(dataset_id)
    safe_name = Path(filename).name or "dataset-file"
    destination = folder / safe_name
    destination.write_bytes(content)
    return destination


def hash_content(content: bytes) -> str:
    return sha256(content).hexdigest()


def delete_dataset_folder(dataset_id: int) -> None:
    folder = DATASETS_DIR / f"dataset_{dataset_id}"
    if folder.exists():
        shutil.rmtree(folder)
