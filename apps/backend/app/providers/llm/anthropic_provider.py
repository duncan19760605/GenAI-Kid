from decimal import Decimal

from anthropic import AsyncAnthropic

from app.providers.base import LLMProvider, LLMMessage, LLMResponse

PRICING = {
    "claude-sonnet-4-5-20250929": {"input": Decimal("3.00"), "output": Decimal("15.00")},
    "claude-haiku-4-5-20251001": {"input": Decimal("0.80"), "output": Decimal("4.00")},
}


class AnthropicLLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-haiku-4-5-20251001"):
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    def name(self) -> str:
        return "anthropic"

    async def chat(self, messages: list[LLMMessage], system_prompt: str = "") -> LLMResponse:
        anthropic_messages = []
        for msg in messages:
            role = "user" if msg.role == "user" else "assistant"
            anthropic_messages.append({"role": role, "content": msg.content})

        response = await self._client.messages.create(
            model=self._model,
            max_tokens=300,
            system=system_prompt if system_prompt else "",
            messages=anthropic_messages,
        )

        text = response.content[0].text if response.content else ""
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens

        pricing = PRICING.get(self._model, PRICING["claude-haiku-4-5-20251001"])
        cost = (Decimal(input_tokens) * pricing["input"] + Decimal(output_tokens) * pricing["output"]) / Decimal("1000000")

        return LLMResponse(
            text=text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
            model=self._model,
        )
