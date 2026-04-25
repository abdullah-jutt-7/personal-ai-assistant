from pydantic import BaseModel


class DatasetSummary(BaseModel):
    id: int
    name: str
    description: str
    updated_at: str
    source_count: int
    version_count: int
    chunk_count: int


class DatasetSourceSummary(BaseModel):
    id: int
    file_name: str
    file_path: str
    content_hash: str
    created_at: str


class DatasetVersionSummary(BaseModel):
    id: int
    version_label: str
    notes: str
    created_at: str


class DatasetChunkSummary(BaseModel):
    id: int
    source_id: int
    chunk_index: int
    chunk_text: str


class DatasetDetailResponse(BaseModel):
    id: int
    name: str
    description: str
    updated_at: str
    source_count: int
    version_count: int
    chunk_count: int
    sources: list[DatasetSourceSummary]
    versions: list[DatasetVersionSummary]
    chunks: list[DatasetChunkSummary]


class DatasetImportResponse(BaseModel):
    success: bool
    dataset_id: int
    name: str
    source_name: str
    version_label: str
    chunk_count: int
