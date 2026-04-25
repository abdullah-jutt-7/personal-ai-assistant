from pydantic import BaseModel


class MemorySourceSummary(BaseModel):
    id: int
    name: str
    original_filename: str
    updated_at: str
    chunk_count: int


class MemoryChunkSummary(BaseModel):
    id: int
    chunk_index: int
    chunk_text: str


class MemoryDetailResponse(BaseModel):
    id: int
    name: str
    original_filename: str
    source_type: str
    content_text: str
    updated_at: str
    chunk_count: int
    chunks: list[MemoryChunkSummary]


class MemoryDeleteResponse(BaseModel):
    success: bool
    memory_source_id: int
