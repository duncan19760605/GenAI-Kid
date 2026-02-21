from fastapi import APIRouter

from app.api.parent.auth import router as auth_router
from app.api.parent.children import router as children_router
from app.api.parent.providers import router as providers_router
from app.api.parent.usage import router as usage_router
from app.api.parent.conversations import router as conversations_router

router = APIRouter(prefix="/api/parent")
router.include_router(auth_router)
router.include_router(children_router)
router.include_router(providers_router)
router.include_router(usage_router)
router.include_router(conversations_router)
