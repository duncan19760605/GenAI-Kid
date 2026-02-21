from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.daily_usage import DailyUsage
from app.schemas.usage import DailyUsageResponse, UsageSummaryResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/daily", response_model=list[DailyUsageResponse])
async def get_daily_usage(
    days: int = Query(default=7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    result = await db.execute(
        select(DailyUsage)
        .where(DailyUsage.user_id == user.id, DailyUsage.date >= since)
        .order_by(DailyUsage.date.desc())
    )
    return result.scalars().all()


@router.get("/summary", response_model=UsageSummaryResponse)
async def get_usage_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            func.coalesce(func.sum(DailyUsage.total_sessions), 0),
            func.coalesce(func.sum(DailyUsage.total_duration_ms), 0),
            func.coalesce(func.sum(DailyUsage.total_tokens), 0),
            func.coalesce(func.sum(DailyUsage.total_cost_usd), 0),
            func.count(DailyUsage.id),
        ).where(DailyUsage.user_id == user.id)
    )
    row = result.one()
    return UsageSummaryResponse(
        total_sessions=row[0],
        total_duration_ms=row[1],
        total_tokens=row[2],
        total_cost_usd=float(row[3]),
        days_active=row[4],
    )
