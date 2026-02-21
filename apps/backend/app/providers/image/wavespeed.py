from decimal import Decimal

import httpx

from app.providers.base import ImageProvider, ImageResponse


class WaveSpeedImageProvider(ImageProvider):
    def __init__(self, api_key: str, base_url: str = "https://api.wavespeed.ai", model: str = "wavespeed-ai/z-image/turbo-lora"):
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model

    def name(self) -> str:
        return "wavespeed"

    async def generate(self, prompt: str, style: str = "") -> ImageResponse:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self._base_url}/v1/images/generate",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={
                    "model": self._model,
                    "prompt": prompt,
                    "style": style or "hand-drawn cartoon animal, friendly, rounded, child-safe",
                    "width": 512,
                    "height": 512,
                },
            )
            response.raise_for_status()
            data = response.json()

        return ImageResponse(
            image_url=data.get("url", ""),
            cost_usd=Decimal(str(data.get("cost", "0.02"))),
        )
