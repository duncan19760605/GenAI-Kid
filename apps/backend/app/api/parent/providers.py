from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.provider_config import ProviderConfig
from app.schemas.provider import ProviderConfigCreate, ProviderConfigResponse
from app.auth.security import get_current_user
from app.auth.encryption import encrypt_api_key

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=list[ProviderConfigResponse])
async def list_providers(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))
    configs = result.scalars().all()
    return [
        ProviderConfigResponse(
            id=str(c.id),
            provider_type=c.provider_type,
            provider_name=c.provider_name,
            model_name=c.model_name,
            config_json=c.config_json,
            is_active=c.is_active,
            has_api_key=c.api_key_encrypted is not None,
        )
        for c in configs
    ]


@router.post("", response_model=ProviderConfigResponse, status_code=status.HTTP_201_CREATED)
async def upsert_provider(
    req: ProviderConfigCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Upsert: find existing config for same type+name, or create new
    result = await db.execute(
        select(ProviderConfig).where(
            ProviderConfig.user_id == user.id,
            ProviderConfig.provider_type == req.provider_type,
            ProviderConfig.provider_name == req.provider_name,
        )
    )
    config = result.scalar_one_or_none()

    if config is None:
        config = ProviderConfig(user_id=user.id, provider_type=req.provider_type, provider_name=req.provider_name)
        db.add(config)

    if req.api_key:
        config.api_key_encrypted = encrypt_api_key(req.api_key)
    config.model_name = req.model_name
    config.config_json = req.config_json
    config.is_active = True

    await db.commit()
    await db.refresh(config)
    return ProviderConfigResponse(
        id=str(config.id),
        provider_type=config.provider_type,
        provider_name=config.provider_name,
        model_name=config.model_name,
        config_json=config.config_json,
        is_active=config.is_active,
        has_api_key=config.api_key_encrypted is not None,
    )
