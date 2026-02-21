from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal


@dataclass
class LLMMessage:
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LLMResponse:
    text: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: Decimal = Decimal("0")
    model: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class STTResponse:
    text: str
    language: str = ""
    confidence: float = 0.0
    duration_seconds: float = 0.0
    cost_usd: Decimal = Decimal("0")


@dataclass
class TTSResponse:
    audio_bytes: bytes = b""
    duration_seconds: float = 0.0
    cost_usd: Decimal = Decimal("0")
    format: str = "mp3"


@dataclass
class ImageResponse:
    image_url: str = ""
    image_bytes: bytes = b""
    cost_usd: Decimal = Decimal("0")


class LLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list[LLMMessage], system_prompt: str = "") -> LLMResponse:
        ...

    @abstractmethod
    def name(self) -> str:
        ...


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str = "") -> STTResponse:
        ...

    @abstractmethod
    def name(self) -> str:
        ...


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "en", voice: str = "") -> TTSResponse:
        ...

    @abstractmethod
    def name(self) -> str:
        ...


class ImageProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, style: str = "") -> ImageResponse:
        ...

    @abstractmethod
    def name(self) -> str:
        ...
