from pydantic import BaseModel


class InstalledModelSummary(BaseModel):
    name: str
    modified_at: str | None = None
    size: int | None = None
