from datetime import datetime
from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    language: str | None
    emotion: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    child_id: str
    started_at: datetime
    ended_at: datetime | None
    language: str | None
    total_tokens: int
    estimated_cost_usd: float

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
