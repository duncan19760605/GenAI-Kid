import base64
import json
import uuid
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.database import async_session
from app.models.child import Child
from app.auth.security import decode_token
from app.services.conversation import ConversationSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/voice/{child_id}")
async def voice_websocket(
    websocket: WebSocket,
    child_id: uuid.UUID,
    token: str = Query(...),
):
    # Authenticate
    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await websocket.accept()

    async with async_session() as db:
        # Verify child belongs to user
        result = await db.execute(
            select(Child).where(Child.id == child_id, Child.user_id == user_id)
        )
        child = result.scalar_one_or_none()
        if not child:
            await websocket.send_json({"type": "error", "message": "Child not found"})
            await websocket.close(code=4004)
            return

        # Start conversation session
        session = ConversationSession(db=db, child=child, user_id=user_id)
        await session.start()
        await websocket.send_json({"type": "session_started", "conversation_id": str(session.conversation.id)})

        audio_buffer = bytearray()

        try:
            while True:
                raw = await websocket.receive_text()
                msg = json.loads(raw)
                msg_type = msg.get("type", "")

                if msg_type == "audio_start":
                    audio_buffer = bytearray()
                    await websocket.send_json({"type": "processing", "stage": "listening"})

                elif msg_type == "audio_chunk":
                    chunk = base64.b64decode(msg.get("data", ""))
                    audio_buffer.extend(chunk)

                elif msg_type == "audio_end":
                    if not audio_buffer:
                        await websocket.send_json({"type": "error", "message": "No audio data"})
                        continue

                    await websocket.send_json({"type": "processing", "stage": "thinking"})

                    try:
                        result = await session.process_audio(bytes(audio_buffer))
                    except Exception as e:
                        logger.exception("Error processing audio")
                        await websocket.send_json({"type": "error", "message": str(e)})
                        continue

                    if "error" in result:
                        await websocket.send_json({"type": "error", "message": result["error"]})
                        continue

                    # Send response
                    await websocket.send_json({
                        "type": "response_start",
                        "emotion": result.get("emotion", "neutral"),
                        "child_text": result.get("child_text", ""),
                        "child_emotion": result.get("child_emotion", "neutral"),
                    })

                    # Send audio in chunks (64KB each)
                    audio = result.get("audio", b"")
                    chunk_size = 65536
                    for i in range(0, len(audio), chunk_size):
                        chunk = audio[i:i + chunk_size]
                        await websocket.send_json({
                            "type": "audio_chunk",
                            "data": base64.b64encode(chunk).decode(),
                            "format": result.get("format", "mp3"),
                        })

                    await websocket.send_json({
                        "type": "audio_end",
                        "transcript": result.get("text", ""),
                    })

                elif msg_type == "command":
                    action = msg.get("action", "")
                    value = msg.get("value", "")
                    result = await session.handle_command(action, value)

                    if "error" in result:
                        await websocket.send_json({"type": "error", "message": result["error"]})
                        continue

                    await websocket.send_json({
                        "type": "response_start",
                        "emotion": result.get("emotion", "neutral"),
                    })

                    audio = result.get("audio", b"")
                    chunk_size = 65536
                    for i in range(0, len(audio), chunk_size):
                        chunk = audio[i:i + chunk_size]
                        await websocket.send_json({
                            "type": "audio_chunk",
                            "data": base64.b64encode(chunk).decode(),
                            "format": result.get("format", "mp3"),
                        })

                    await websocket.send_json({
                        "type": "audio_end",
                        "transcript": result.get("text", ""),
                    })

                elif msg_type == "end_session":
                    await session.end()
                    await websocket.send_json({"type": "session_ended"})
                    break

        except WebSocketDisconnect:
            await session.end()
            logger.info(f"WebSocket disconnected for child {child_id}")
        except Exception as e:
            logger.exception(f"WebSocket error for child {child_id}")
            await session.end()
            try:
                await websocket.close(code=1011, reason=str(e))
            except Exception:
                pass
