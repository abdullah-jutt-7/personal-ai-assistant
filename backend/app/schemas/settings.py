from pydantic import BaseModel


class ModelSettingsResponse(BaseModel):
    ollama_model: str


class ModelSettingsUpdateRequest(BaseModel):
    ollama_model: str
