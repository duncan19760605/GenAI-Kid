import random
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildUpdate, ChildResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/children", tags=["children"])


def _generate_login_code() -> str:
    return "".join(random.choices(string.digits, k=6))


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    req: ChildCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    child = Child(
        user_id=user.id,
        name=req.name,
        age=req.age,
        primary_language=req.primary_language,
        learning_languages=req.learning_languages,
        character_id=req.character_id,
        login_code=_generate_login_code(),
    )
    db.add(child)
    await db.commit()
    await db.refresh(child)
    return child


@router.get("", response_model=list[ChildResponse])
async def list_children(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Child).where(Child.user_id == user.id))
    return result.scalars().all()


@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: uuid.UUID,
    req: ChildUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Child).where(Child.id == child_id, Child.user_id == user.id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(child, field, value)

    await db.commit()
    await db.refresh(child)
    return child
