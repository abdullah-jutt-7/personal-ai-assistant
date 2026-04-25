from pydantic import BaseModel


class MemorySourceSummary(BaseModel):
    id: int
    name: str
    original_filename: str
    updated_at: str
    chunk_count: int


class MemoryDeleteResponse(BaseModel):
    success: bool
    memory_source_id: int
