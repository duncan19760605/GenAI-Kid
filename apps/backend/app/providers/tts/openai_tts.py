from decimal import Decimal

from openai import AsyncOpenAI

from app.providers.base import TTSProvider, TTSResponse

# OpenAI TTS pricing: $15.00 per 1M characters
COST_PER_CHAR = Decimal("15.00") / Decimal("1000000")

VOICE_MAP = {
    "zh": "nova",
    "en": "shimmer",
    "es": "alloy",
}


class OpenAITTS(TTSProvider):
    def __init__(self, api_key: str, model: str = "tts-1"):
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    def name(self) -> str:
        return "openai_tts"

    async def synthesize(self, text: str, language: str = "en", voice: str = "") -> TTSResponse:
        if not voice:
            voice = VOICE_MAP.get(language, "shimmer")

        response = await self._client.audio.speech.create(
            model=self._model,
            voice=voice,
            input=text,
            response_format="mp3",
            speed=0.9,  # Slightly slower for children
        )

        audio_bytes = response.content
        cost = COST_PER_CHAR * Decimal(len(text))
        # Rough estimate: ~150 chars per second of audio
        duration = len(text) / 150.0

        return TTSResponse(
            audio_bytes=audio_bytes,
            duration_seconds=duration,
            cost_usd=cost,
            format="mp3",
        )
