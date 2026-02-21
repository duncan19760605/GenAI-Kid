from fastapi import APIRouter

from app.api.kid.auth import router as auth_router
from app.api.kid.character import router as character_router

router = APIRouter(prefix="/api/kid")
router.include_router(auth_router)
router.include_router(character_router)
