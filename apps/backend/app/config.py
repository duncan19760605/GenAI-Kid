from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — SQLite by default, no Docker required
    database_url: str = "sqlite+aiosqlite:///./genius_kid.db"

    # Auth
    jwt_secret: str = "change-me-to-a-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # Encryption key for provider API keys
    encryption_key: str = ""

    # OpenAI (LLM + STT + TTS)
    openai_api_key: str = ""
    openai_llm_model: str = "gpt-4o-mini"
    openai_tts_model: str = "tts-1"
    openai_stt_model: str = "whisper-1"

    # Anthropic (LLM)
    anthropic_api_key: str = ""
    anthropic_llm_model: str = "claude-haiku-4-5-20251001"

    # WaveSpeed AI (image generation)
    wavespeed_api_key: str = ""
    wavespeed_base_url: str = "https://api.wavespeed.ai"
    wavespeed_model: str = "wavespeed-ai/z-image/turbo-lora"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
