from pydantic import BaseModel


class DatasetSummary(BaseModel):
    id: int
    name: str
    description: str
    updated_at: str
    source_count: int
    version_count: int


class DatasetImportResponse(BaseModel):
    success: bool
    dataset_id: int
    name: str
    source_name: str
    version_label: str
