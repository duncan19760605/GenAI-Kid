import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.child import Child
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationResponse, ConversationDetailResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    child_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get all child IDs belonging to this parent
    children_result = await db.execute(select(Child.id).where(Child.user_id == user.id))
    child_ids = [row[0] for row in children_result.all()]

    if not child_ids:
        return []

    query = select(Conversation).where(Conversation.child_id.in_(child_ids))
    if child_id and child_id in child_ids:
        query = select(Conversation).where(Conversation.child_id == child_id)

    query = query.order_by(Conversation.started_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Verify parent owns this child
    child_result = await db.execute(select(Child).where(Child.id == conv.child_id, Child.user_id == user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return conv
