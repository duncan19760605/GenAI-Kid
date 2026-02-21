from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.provider_config import ProviderConfig
from app.auth.encryption import decrypt_api_key
from app.providers.base import LLMProvider, STTProvider, TTSProvider, ImageProvider
from app.providers.llm.openai_provider import OpenAILLMProvider
from app.providers.llm.anthropic_provider import AnthropicLLMProvider
from app.providers.stt.openai_whisper import OpenAIWhisperSTT
from app.providers.tts.openai_tts import OpenAITTS
from app.providers.image.wavespeed import WaveSpeedImageProvider


async def _get_api_key(db: AsyncSession, user_id, provider_type: str, provider_name: str) -> str | None:
    """Get API key from user config, falling back to env defaults."""
    result = await db.execute(
        select(ProviderConfig).where(
            ProviderConfig.user_id == user_id,
            ProviderConfig.provider_type == provider_type,
            ProviderConfig.provider_name == provider_name,
            ProviderConfig.is_active == True,
        )
    )
    config = result.scalar_one_or_none()
    if config and config.api_key_encrypted:
        return decrypt_api_key(config.api_key_encrypted)
    return None


async def _get_model_name(db: AsyncSession, user_id, provider_type: str, provider_name: str) -> str | None:
    result = await db.execute(
        select(ProviderConfig.model_name).where(
            ProviderConfig.user_id == user_id,
            ProviderConfig.provider_type == provider_type,
            ProviderConfig.provider_name == provider_name,
            ProviderConfig.is_active == True,
        )
    )
    row = result.scalar_one_or_none()
    return row


async def get_llm_provider(db: AsyncSession, user_id) -> LLMProvider:
    # Try user's Anthropic config first, then OpenAI, then fall back to env keys
    for name, cls, default_key, default_model in [
        ("anthropic", AnthropicLLMProvider, settings.anthropic_api_key, settings.anthropic_llm_model),
        ("openai", OpenAILLMProvider, settings.openai_api_key, settings.openai_llm_model),
    ]:
        api_key = await _get_api_key(db, user_id, "llm", name) or default_key
        if api_key:
            model = await _get_model_name(db, user_id, "llm", name) or default_model
            return cls(api_key=api_key, model=model)

    raise RuntimeError("No LLM provider configured. Please set an API key in settings.")


async def get_stt_provider(db: AsyncSession, user_id) -> STTProvider:
    api_key = await _get_api_key(db, user_id, "stt", "openai_whisper") or settings.openai_api_key
    if api_key:
        model = await _get_model_name(db, user_id, "stt", "openai_whisper") or settings.openai_stt_model
        return OpenAIWhisperSTT(api_key=api_key, model=model)
    raise RuntimeError("No STT provider configured.")


async def get_tts_provider(db: AsyncSession, user_id) -> TTSProvider:
    api_key = await _get_api_key(db, user_id, "tts", "openai_tts") or settings.openai_api_key
    if api_key:
        model = await _get_model_name(db, user_id, "tts", "openai_tts") or settings.openai_tts_model
        return OpenAITTS(api_key=api_key, model=model)
    raise RuntimeError("No TTS provider configured.")


async def get_image_provider(db: AsyncSession, user_id) -> ImageProvider:
    api_key = await _get_api_key(db, user_id, "image", "wavespeed") or settings.wavespeed_api_key
    if api_key:
        model = await _get_model_name(db, user_id, "image", "wavespeed") or settings.wavespeed_model
        return WaveSpeedImageProvider(api_key=api_key, base_url=settings.wavespeed_base_url, model=model)
    raise RuntimeError("No image provider configured.")
