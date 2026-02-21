from datetime import date
from pydantic import BaseModel


class DailyUsageResponse(BaseModel):
    date: date
    total_sessions: int
    total_duration_ms: int
    total_tokens: int
    total_cost_usd: float
    llm_tokens: int
    tts_chars: int
    stt_seconds: float

    model_config = {"from_attributes": True}


class UsageSummaryResponse(BaseModel):
    total_sessions: int
    total_duration_ms: int
    total_tokens: int
    total_cost_usd: float
    days_active: int
