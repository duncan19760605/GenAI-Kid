import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.child import Child
from app.models.conversation import Conversation, Message
from app.providers.base import LLMMessage, LLMResponse, STTResponse, TTSResponse
from app.providers.factory import get_llm_provider, get_stt_provider, get_tts_provider
from app.prompts.character import build_system_prompt
from app.services.safety import check_content_safety, sanitize_for_child, get_safety_redirect
from app.services.emotion import detect_emotion, suggest_character_emotion
from app.services.cost import track_usage


class ConversationSession:
    """Manages a single voice conversation session."""

    def __init__(self, db: AsyncSession, child: Child, user_id: uuid.UUID):
        self.db = db
        self.child = child
        self.user_id = user_id
        self.conversation: Conversation | None = None
        self.history: list[LLMMessage] = []
        self.language = child.primary_language
        self.system_prompt = build_system_prompt(
            character_id=child.character_id,
            child_name=child.name,
            child_age=child.age,
            language=child.primary_language,
            learning_languages=child.learning_languages,
        )
        self._last_response_text = ""

    async def start(self) -> Conversation:
        self.conversation = Conversation(
            child_id=self.child.id,
            language=self.language,
        )
        self.db.add(self.conversation)
        await self.db.flush()
        await track_usage(self.db, self.user_id, is_new_session=True)
        await self.db.commit()
        return self.conversation

    async def process_audio(self, audio_bytes: bytes) -> dict:
        """Full pipeline: STT -> safety check -> LLM -> safety check -> TTS."""
        stt = await get_stt_provider(self.db, self.user_id)
        llm = await get_llm_provider(self.db, self.user_id)
        tts = await get_tts_provider(self.db, self.user_id)

        # 1. Speech to text
        stt_result: STTResponse = await stt.transcribe(audio_bytes, language=self.language)
        child_text = stt_result.text.strip()

        if not child_text:
            return {"error": "no_speech", "emotion": "curious"}

        # 2. Check child input safety
        is_safe, reason = check_content_safety(child_text)
        child_emotion = detect_emotion(child_text)

        # Save child message
        child_msg = Message(
            conversation_id=self.conversation.id,
            role="child",
            content=child_text,
            language=self.language,
            emotion=child_emotion,
            audio_duration_ms=int(stt_result.duration_seconds * 1000),
            cost_usd=stt_result.cost_usd,
        )
        self.db.add(child_msg)

        # 3. Generate response
        if not is_safe:
            response_text = get_safety_redirect(self.language)
            char_emotion = "gentle"
            llm_result = None
        else:
            self.history.append(LLMMessage(role="user", content=child_text))
            llm_result: LLMResponse = await llm.chat(self.history, system_prompt=self.system_prompt)
            response_text = sanitize_for_child(llm_result.text)
            char_emotion = suggest_character_emotion(child_emotion)
            self.history.append(LLMMessage(role="assistant", content=response_text))

        self._last_response_text = response_text

        # 4. Text to speech
        tts_result: TTSResponse = await tts.synthesize(response_text, language=self.language)

        # Save character message
        total_cost = (llm_result.cost_usd if llm_result else Decimal("0")) + tts_result.cost_usd + stt_result.cost_usd
        total_tokens = (llm_result.input_tokens + llm_result.output_tokens) if llm_result else 0

        char_msg = Message(
            conversation_id=self.conversation.id,
            role="character",
            content=response_text,
            language=self.language,
            emotion=char_emotion,
            tokens_used=total_tokens,
            cost_usd=total_cost,
        )
        self.db.add(char_msg)

        # Update conversation totals
        self.conversation.total_tokens += total_tokens
        self.conversation.estimated_cost_usd += total_cost

        # Track usage
        await track_usage(
            self.db,
            self.user_id,
            llm_tokens=total_tokens,
            tts_chars=len(response_text),
            stt_seconds=stt_result.duration_seconds,
            cost_usd=total_cost,
        )
        await self.db.commit()

        return {
            "audio": tts_result.audio_bytes,
            "text": response_text,
            "emotion": char_emotion,
            "child_text": child_text,
            "child_emotion": child_emotion,
            "format": tts_result.format,
        }

    async def handle_command(self, action: str, value: str = "") -> dict:
        """Handle round control commands."""
        if action == "repeat" and self._last_response_text:
            tts = await get_tts_provider(self.db, self.user_id)
            tts_result = await tts.synthesize(self._last_response_text, language=self.language)
            return {
                "audio": tts_result.audio_bytes,
                "text": self._last_response_text,
                "emotion": "happy",
                "format": tts_result.format,
            }

        elif action == "slower" and self._last_response_text:
            tts = await get_tts_provider(self.db, self.user_id)
            # Re-synthesize at slower speed (handled in TTS provider)
            tts_result = await tts.synthesize(self._last_response_text, language=self.language)
            return {
                "audio": tts_result.audio_bytes,
                "text": self._last_response_text,
                "emotion": "patient",
                "format": tts_result.format,
            }

        elif action == "switch_language" and value:
            self.language = value
            # Rebuild system prompt for new language
            self.system_prompt = build_system_prompt(
                character_id=self.child.character_id,
                child_name=self.child.name,
                child_age=self.child.age,
                language=value,
                learning_languages=self.child.learning_languages,
            )
            greetings = {
                "zh": f"好的！我們現在說中文吧，{self.child.name}！",
                "en": f"Okay! Let's speak English now, {self.child.name}!",
                "es": f"¡Está bien! ¡Hablemos español ahora, {self.child.name}!",
            }
            text = greetings.get(value, greetings["en"])
            tts = await get_tts_provider(self.db, self.user_id)
            tts_result = await tts.synthesize(text, language=value)
            return {
                "audio": tts_result.audio_bytes,
                "text": text,
                "emotion": "excited",
                "format": tts_result.format,
            }

        return {"error": "unknown_command"}

    async def end(self):
        if self.conversation:
            from datetime import datetime, timezone
            self.conversation.ended_at = datetime.now(timezone.utc)
            await self.db.commit()
