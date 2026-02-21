from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.child import Child
from app.prompts.character import CHARACTER_PROFILES

router = APIRouter(prefix="/character", tags=["character"])


class CharacterResponse(BaseModel):
    character_id: str
    name: str
    personality: str
    emotions: list[str]


@router.get("/{child_id}", response_model=CharacterResponse)
async def get_character(child_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.id == child_id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    profile = CHARACTER_PROFILES.get(child.character_id, CHARACTER_PROFILES["bear"])
    name_key = f"name_{child.primary_language}"
    name = profile.get(name_key, profile["name_en"])

    return CharacterResponse(
        character_id=child.character_id,
        name=name,
        personality=profile["personality"],
        emotions=["happy", "curious", "sad", "excited", "encouraging", "empathetic", "patient", "gentle"],
    )
