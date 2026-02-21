from decimal import Decimal

from openai import AsyncOpenAI

from app.providers.base import LLMProvider, LLMMessage, LLMResponse

# Approximate pricing per 1M tokens (as of 2024)
PRICING = {
    "gpt-4o": {"input": Decimal("2.50"), "output": Decimal("10.00")},
    "gpt-4o-mini": {"input": Decimal("0.15"), "output": Decimal("0.60")},
    "gpt-4-turbo": {"input": Decimal("10.00"), "output": Decimal("30.00")},
}


class OpenAILLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    def name(self) -> str:
        return "openai"

    async def chat(self, messages: list[LLMMessage], system_prompt: str = "") -> LLMResponse:
        openai_messages = []
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            openai_messages.append({"role": msg.role, "content": msg.content})

        response = await self._client.chat.completions.create(
            model=self._model,
            messages=openai_messages,
            max_tokens=300,  # Keep responses short for children
            temperature=0.7,
        )

        choice = response.choices[0]
        usage = response.usage
        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0

        pricing = PRICING.get(self._model, PRICING["gpt-4o-mini"])
        cost = (Decimal(input_tokens) * pricing["input"] + Decimal(output_tokens) * pricing["output"]) / Decimal("1000000")

        return LLMResponse(
            text=choice.message.content or "",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
            model=self._model,
        )
