from datetime import date, timezone, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily_usage import DailyUsage


async def track_usage(
    db: AsyncSession,
    user_id,
    llm_tokens: int = 0,
    tts_chars: int = 0,
    stt_seconds: float = 0,
    cost_usd: Decimal = Decimal("0"),
    duration_ms: int = 0,
    is_new_session: bool = False,
):
    """Increment daily usage counters."""
    today = date.today()

    result = await db.execute(
        select(DailyUsage).where(DailyUsage.user_id == user_id, DailyUsage.date == today)
    )
    usage = result.scalar_one_or_none()

    if usage is None:
        usage = DailyUsage(user_id=user_id, date=today)
        db.add(usage)

    usage.total_tokens += llm_tokens
    usage.total_cost_usd += cost_usd
    usage.total_duration_ms += duration_ms
    usage.llm_tokens += llm_tokens
    usage.tts_chars += tts_chars
    usage.stt_seconds += Decimal(str(stt_seconds))
    if is_new_session:
        usage.total_sessions += 1

    await db.flush()
