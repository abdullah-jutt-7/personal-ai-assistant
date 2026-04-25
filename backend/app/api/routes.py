from datetime import datetime
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.models.entities import (
    Conversation,
    Dataset,
    DatasetChunk,
    DatasetSource,
    DatasetVersion,
    Message,
    MemoryChunk,
    MemorySource,
)
from backend.app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationMessage,
    ConversationSummary,
)
from backend.app.schemas.datasets import DatasetImportResponse, DatasetSummary
from backend.app.schemas.datasets import (
    DatasetChunkSummary,
    DatasetDetailResponse,
    DatasetSourceSummary,
    DatasetVersionSummary,
)
from backend.app.schemas.memory import MemoryDeleteResponse, MemorySourceSummary
from backend.app.services.dataset_context import build_dataset_context
from backend.app.services.dataset_store import delete_dataset_folder, hash_content, save_dataset_file
from backend.app.services.memory_context import build_memory_context
from backend.app.services.ollama_client import generate_reply, stream_reply


router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "assistant": "IntelliText",
        "backend": "FastAPI",
        "database": "SQLite",
        "model": settings.ollama_model,
    }


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(db: Session = Depends(get_db)):
    conversations = db.scalars(select(Conversation).order_by(desc(Conversation.updated_at))).all()
    return [
        ConversationSummary(
            id=conversation.id,
            title=conversation.title,
            updated_at=conversation.updated_at.isoformat(),
        )
        for conversation in conversations
    ]


@router.post("/conversations", response_model=ConversationSummary)
def create_conversation(db: Session = Depends(get_db)):
    conversation = Conversation(title="New conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return ConversationSummary(
        id=conversation.id,
        title=conversation.title,
        updated_at=conversation.updated_at.isoformat(),
    )


@router.get("/conversations/{conversation_id}", response_model=list[ConversationMessage])
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        .all()
    )

    return [
        ConversationMessage(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at.isoformat(),
        )
        for message in messages
    ]


@router.get("/datasets", response_model=list[DatasetSummary])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.scalars(select(Dataset).order_by(desc(Dataset.updated_at))).all()

    result: list[DatasetSummary] = []
    for dataset in datasets:
        source_count = db.scalar(
            select(func.count()).select_from(DatasetSource).where(DatasetSource.dataset_id == dataset.id)
        )
        version_count = db.scalar(
            select(func.count()).select_from(DatasetVersion).where(DatasetVersion.dataset_id == dataset.id)
        )
        chunk_count = db.scalar(
            select(func.count()).select_from(DatasetChunk).where(DatasetChunk.dataset_id == dataset.id)
        )
        result.append(
            DatasetSummary(
                id=dataset.id,
                name=dataset.name,
                description=dataset.description,
                updated_at=dataset.updated_at.isoformat(),
                source_count=source_count or 0,
                version_count=version_count or 0,
                chunk_count=chunk_count or 0,
            )
        )

    return result


@router.get("/datasets/{dataset_id}", response_model=DatasetDetailResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    sources = db.scalars(
        select(DatasetSource).where(DatasetSource.dataset_id == dataset.id).order_by(DatasetSource.created_at.asc())
    ).all()
    versions = db.scalars(
        select(DatasetVersion).where(DatasetVersion.dataset_id == dataset.id).order_by(DatasetVersion.created_at.asc())
    ).all()
    chunks = db.scalars(
        select(DatasetChunk).where(DatasetChunk.dataset_id == dataset.id).order_by(DatasetChunk.chunk_index.asc())
    ).all()

    return DatasetDetailResponse(
        id=dataset.id,
        name=dataset.name,
        description=dataset.description,
        updated_at=dataset.updated_at.isoformat(),
        source_count=len(sources),
        version_count=len(versions),
        chunk_count=len(chunks),
        sources=[
            DatasetSourceSummary(
                id=source.id,
                file_name=source.file_name,
                file_path=source.file_path,
                content_hash=source.content_hash,
                created_at=source.created_at.isoformat(),
            )
            for source in sources
        ],
        versions=[
            DatasetVersionSummary(
                id=version.id,
                version_label=version.version_label,
                notes=version.notes,
                created_at=version.created_at.isoformat(),
            )
            for version in versions
        ],
        chunks=[
            DatasetChunkSummary(
                id=chunk.id,
                source_id=chunk.source_id,
                chunk_index=chunk.chunk_index,
                chunk_text=chunk.chunk_text,
            )
            for chunk in chunks
        ],
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    message_text = request.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message is required")

    conversation = None
    if request.conversation_id is not None:
        conversation = db.get(Conversation, request.conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(title=message_text[:48] or "New conversation")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_text,
    )
    db.add(user_message)
    db.commit()

    history = (
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        .all()
    )

    ollama_messages = [
        {"role": message.role, "content": message.content}
        for message in history
    ]
    memory_context = build_memory_context(db)
    dataset_context = build_dataset_context(db)

    try:
        assistant_text = await generate_reply(
            ollama_messages,
            memory_context=memory_context,
            dataset_context=dataset_context,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach Ollama. Make sure it is running locally. Details: {exc}",
        ) from exc

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=assistant_text,
    )
    db.add(assistant_message)
    conversation.updated_at = datetime.utcnow()
    db.commit()

    return ChatResponse(conversation_id=conversation.id, response=assistant_text)


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    message_text = request.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message is required")

    conversation = None
    if request.conversation_id is not None:
        conversation = db.get(Conversation, request.conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(title=message_text[:48] or "New conversation")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_text,
    )
    db.add(user_message)
    db.commit()

    history = (
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        .all()
    )

    ollama_messages = [
        {"role": message.role, "content": message.content}
        for message in history
    ]
    memory_context = build_memory_context(db)
    dataset_context = build_dataset_context(db)

    def sse(event: str, data: dict[str, object]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        assistant_parts: list[str] = []
        thinking_parts: list[str] = []

        try:
            yield sse(
                "meta",
                {
                    "conversation_id": conversation.id,
                    "model": settings.ollama_model,
                },
            )

            async for piece in stream_reply(
                ollama_messages,
                memory_context=memory_context,
                dataset_context=dataset_context,
            ):
                if piece["type"] == "thinking":
                    thinking_parts.append(piece["delta"])
                    yield sse("thinking", {"delta": piece["delta"]})
                elif piece["type"] == "content":
                    assistant_parts.append(piece["delta"])
                    yield sse("content", {"delta": piece["delta"]})
                elif piece["type"] == "done":
                    assistant_text = "".join(assistant_parts).strip()
                    if assistant_text:
                        assistant_message = Message(
                            conversation_id=conversation.id,
                            role="assistant",
                            content=assistant_text,
                        )
                        db.add(assistant_message)
                        conversation.updated_at = datetime.utcnow()
                        db.commit()

                    yield sse(
                        "done",
                        {
                            "conversation_id": conversation.id,
                            "response": assistant_text,
                            "thinking": "".join(thinking_parts).strip(),
                        },
                    )
                    return
        except Exception as exc:
            yield sse("error", {"detail": str(exc)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/memory/upload")
async def upload_memory(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    raw = await file.read()

    try:
        content_text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="Only UTF-8 text files are supported for memory upload.",
        ) from exc

    source = MemorySource(
        name=file.filename or "memory",
        source_type="txt",
        original_filename=file.filename or "",
        content_text=content_text,
    )
    db.add(source)
    db.flush()

    chunks = [chunk.strip() for chunk in content_text.split("\n\n") if chunk.strip()]
    if not chunks and content_text.strip():
        chunks = [content_text.strip()]

    for index, chunk in enumerate(chunks):
        db.add(
            MemoryChunk(
                memory_source_id=source.id,
                chunk_index=index,
                chunk_text=chunk,
            )
        )

    db.commit()

    return {
        "success": True,
        "memory_source_id": source.id,
        "name": source.name,
        "chunk_count": len(chunks),
    }


@router.get("/memory", response_model=list[MemorySourceSummary])
def list_memory_sources(db: Session = Depends(get_db)):
    sources = db.scalars(select(MemorySource).order_by(desc(MemorySource.updated_at))).all()

    result: list[MemorySourceSummary] = []
    for source in sources:
        chunk_count = db.scalar(
            select(func.count()).select_from(MemoryChunk).where(MemoryChunk.memory_source_id == source.id)
        )
        result.append(
            MemorySourceSummary(
                id=source.id,
                name=source.name,
                original_filename=source.original_filename,
                updated_at=source.updated_at.isoformat(),
                chunk_count=chunk_count or 0,
            )
        )

    return result


@router.delete("/memory/{memory_source_id}", response_model=MemoryDeleteResponse)
def delete_memory_source(memory_source_id: int, db: Session = Depends(get_db)):
    source = db.get(MemorySource, memory_source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Memory source not found")

    db.delete(source)
    db.commit()

    return {"success": True, "memory_source_id": memory_source_id}


@router.post("/datasets/upload", response_model=DatasetImportResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(default=""),
    description: str = Form(default=""),
    db: Session = Depends(get_db),
):
    raw = await file.read()

    if not raw:
        raise HTTPException(status_code=400, detail="Dataset file is empty.")

    try:
        content_text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="Only UTF-8 text datasets are supported for now.",
        ) from exc

    dataset_name = name.strip() or Path(file.filename or "dataset").stem or "dataset"
    dataset = Dataset(name=dataset_name, description=description.strip())
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    saved_path = save_dataset_file(dataset.id, file.filename or dataset_name, raw)
    content_hash = hash_content(raw)

    source = DatasetSource(
        dataset_id=dataset.id,
        file_name=file.filename or dataset_name,
        file_path=str(saved_path),
        content_hash=content_hash,
    )
    db.add(source)
    db.flush()

    chunks = [chunk.strip() for chunk in content_text.split("\n\n") if chunk.strip()]
    if not chunks and content_text.strip():
        chunks = [content_text.strip()]

    for index, chunk in enumerate(chunks):
        db.add(
            DatasetChunk(
                dataset_id=dataset.id,
                source_id=source.id,
                chunk_index=index,
                chunk_text=chunk,
            )
        )

    version = DatasetVersion(
        dataset_id=dataset.id,
        version_label="v1",
        notes="Initial local dataset import",
    )
    db.add(version)
    db.commit()

    return DatasetImportResponse(
        success=True,
        dataset_id=dataset.id,
        name=dataset.name,
        source_name=source.file_name,
        version_label=version.version_label,
        chunk_count=len(chunks),
    )


@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    delete_dataset_folder(dataset_id)
    db.delete(dataset)
    db.commit()

    return {"success": True, "dataset_id": dataset_id}
