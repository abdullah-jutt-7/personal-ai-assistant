from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.app.models.entities import Dataset, DatasetChunk


def build_dataset_context(db: Session, *, max_datasets: int = 3, max_chars: int = 7000) -> str:
    datasets = db.scalars(
        select(Dataset).order_by(desc(Dataset.updated_at)).limit(max_datasets)
    ).all()

    if not datasets:
        return ""

    sections: list[str] = []
    total_chars = 0

    for dataset in datasets:
        chunks = db.scalars(
            select(DatasetChunk)
            .where(DatasetChunk.dataset_id == dataset.id)
            .order_by(DatasetChunk.chunk_index.asc())
        ).all()

        if not chunks:
            continue

        chunk_text = "\n".join(chunk.chunk_text.strip() for chunk in chunks if chunk.chunk_text.strip())
        if not chunk_text:
            continue

        section = f"Dataset: {dataset.name}\n{chunk_text}".strip()
        projected_length = total_chars + len(section)

        if sections and projected_length > max_chars:
            break

        if projected_length > max_chars:
            remaining = max_chars - total_chars
            if remaining <= 0:
                break
            section = section[:remaining].rstrip()

        sections.append(section)
        total_chars += len(section)

        if total_chars >= max_chars:
            break

    if not sections:
        return ""

    return "\n\n".join(sections).strip()
