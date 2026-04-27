from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    conversation_id: int
    response: str


class ConversationSummary(BaseModel):
    id: int
    title: str
    updated_at: str


class ConversationMessage(BaseModel):
    id: int
    role: str
    content: str
    reasoning_text: str | None = None
    reasoning_seconds: int | None = None
    created_at: str


class ConversationUpdateRequest(BaseModel):
    title: str


class ConversationUpdateResponse(BaseModel):
    success: bool
    conversation_id: int
    title: str


class ConversationDeleteResponse(BaseModel):
    success: bool
    conversation_id: int
