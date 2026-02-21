from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.child import Child
from app.auth.security import create_access_token

router = APIRouter(prefix="/auth", tags=["kid-auth"])


class ChildLoginRequest(BaseModel):
    login_code: str


class ChildLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    child_name: str
    character_id: str


@router.post("/login", response_model=ChildLoginResponse)
async def child_login(req: ChildLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.login_code == req.login_code))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid code")

    # Create token with the parent's user_id (for provider access)
    token = create_access_token(child.user_id)

    return ChildLoginResponse(
        access_token=token,
        child_name=child.name,
        character_id=child.character_id,
    )
