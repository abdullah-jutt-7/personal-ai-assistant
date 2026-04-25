from datetime import datetime
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.models.entities import Conversation, Message, MemoryChunk, MemorySource
from backend.app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationMessage,
    ConversationSummary,
)
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

    try:
        assistant_text = await generate_reply(ollama_messages, memory_context=memory_context)
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

            async for piece in stream_reply(ollama_messages, memory_context=memory_context):
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
