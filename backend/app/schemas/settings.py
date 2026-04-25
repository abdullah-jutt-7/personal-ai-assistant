from pydantic import BaseModel


class ModelSettingsResponse(BaseModel):
    ollama_model: str


class ModelSettingsUpdateRequest(BaseModel):
    ollama_model: str


class ThemeSettingsResponse(BaseModel):
    theme: str


class ThemeSettingsUpdateRequest(BaseModel):
    theme: str
