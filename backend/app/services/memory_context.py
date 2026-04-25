from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from backend.app.models.entities import MemoryChunk, MemorySource


def build_memory_context(db: Session, *, max_sources: int = 5, max_chars: int = 6000) -> str:
    sources = db.scalars(
        select(MemorySource).order_by(desc(MemorySource.updated_at)).limit(max_sources)
    ).all()

    if not sources:
        return ""

    sections: list[str] = []
    total_chars = 0

    for source in sources:
        chunks = db.scalars(
            select(MemoryChunk)
            .where(MemoryChunk.memory_source_id == source.id)
            .order_by(MemoryChunk.chunk_index.asc())
        ).all()

        if not chunks:
            continue

        chunk_text = "\n".join(chunk.chunk_text.strip() for chunk in chunks if chunk.chunk_text.strip())
        if not chunk_text:
            continue

        section = f"Source: {source.name}\n{chunk_text}".strip()
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
