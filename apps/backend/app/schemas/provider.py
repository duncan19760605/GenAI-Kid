from pydantic import BaseModel


class ProviderConfigCreate(BaseModel):
    provider_type: str  # llm, stt, tts, image
    provider_name: str  # openai, anthropic, whisper, etc.
    api_key: str | None = None
    model_name: str | None = None
    config_json: dict = {}


class ProviderConfigResponse(BaseModel):
    id: str
    provider_type: str
    provider_name: str
    model_name: str | None
    config_json: dict
    is_active: bool
    has_api_key: bool  # Don't expose actual key

    model_config = {"from_attributes": True}
