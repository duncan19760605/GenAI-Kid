import io
from decimal import Decimal

from openai import AsyncOpenAI

from app.providers.base import STTProvider, STTResponse

# OpenAI Whisper pricing: $0.006 per minute
COST_PER_MINUTE = Decimal("0.006")


class OpenAIWhisperSTT(STTProvider):
    def __init__(self, api_key: str, model: str = "whisper-1"):
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    def name(self) -> str:
        return "openai_whisper"

    async def transcribe(self, audio_bytes: bytes, language: str = "") -> STTResponse:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.webm"

        kwargs = {"model": self._model, "file": audio_file, "response_format": "verbose_json"}
        if language:
            kwargs["language"] = language

        response = await self._client.audio.transcriptions.create(**kwargs)

        duration = getattr(response, "duration", 0.0) or 0.0
        cost = COST_PER_MINUTE * Decimal(str(duration)) / Decimal("60")

        return STTResponse(
            text=response.text,
            language=getattr(response, "language", language),
            duration_seconds=duration,
            cost_usd=cost,
        )
