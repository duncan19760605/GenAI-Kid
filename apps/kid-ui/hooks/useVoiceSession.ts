import { useState, useRef, useCallback, useEffect } from "react";
import { WS_BASE_URL } from "../constants/api";
import { getToken } from "../services/api";
import { AudioManager, RecordingManager } from "../services/audioManager";

export type SessionStage =
  | "idle"
  | "recording"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface VoiceSessionState {
  stage: SessionStage;
  emotion: string;
  childEmotion: string;
  transcript: string;
  childText: string;
  error: string | null;
  conversationId: string | null;
}

export function useVoiceSession(childId: string) {
  const [state, setState] = useState<VoiceSessionState>({
    stage: "idle",
    emotion: "happy",
    childEmotion: "neutral",
    transcript: "",
    childText: "",
    error: null,
    conversationId: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioManagerRef = useRef(new AudioManager());
  const recordingManagerRef = useRef(new RecordingManager());
  const audioChunksRef = useRef<string[]>([]);
  const audioFormatRef = useRef("mp3");
  const amplitudeCallbackRef = useRef<((amp: number) => void) | null>(null);

  // Connect WebSocket
  const connect = useCallback(async () => {
    const token = await getToken();
    if (!token || !childId) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/voice/${childId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, error: null }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "session_started":
          setState((s) => ({ ...s, conversationId: msg.conversation_id }));
          break;

        case "processing":
          setState((s) => ({ ...s, stage: msg.stage }));
          break;

        case "response_start":
          audioChunksRef.current = [];
          setState((s) => ({
            ...s,
            stage: "speaking",
            emotion: msg.emotion || "happy",
            childText: msg.child_text || s.childText,
            childEmotion: msg.child_emotion || s.childEmotion,
          }));
          break;

        case "audio_chunk":
          audioChunksRef.current.push(msg.data);
          audioFormatRef.current = msg.format || "mp3";
          break;

        case "audio_end":
          setState((s) => ({ ...s, transcript: msg.transcript || "" }));
          // Play collected audio
          await audioManagerRef.current.playAudioChunks(
            audioChunksRef.current,
            audioFormatRef.current
          );
          // After playback, go back to idle
          setState((s) => ({ ...s, stage: "idle" }));
          break;

        case "session_ended":
          setState((s) => ({ ...s, stage: "idle" }));
          break;

        case "error":
          setState((s) => ({ ...s, error: msg.message, stage: "idle" }));
          break;
      }
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, error: "Connection error", stage: "error" }));
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    await audioManagerRef.current.initialize();
  }, [childId]);

  // Start recording (push-to-talk)
  const startRecording = useCallback(async () => {
    if (!wsRef.current || state.stage === "speaking") return;

    try {
      await audioManagerRef.current.stopPlayback();
      await recordingManagerRef.current.startRecording();
      wsRef.current.send(JSON.stringify({ type: "audio_start" }));
      setState((s) => ({ ...s, stage: "recording", error: null }));
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message, stage: "idle" }));
    }
  }, [state.stage]);

  // Stop recording and send audio
  const stopRecording = useCallback(async () => {
    if (state.stage !== "recording") return;

    const base64 = await recordingManagerRef.current.stopRecording();
    if (base64 && wsRef.current) {
      // Send audio in chunks (64KB)
      const chunkSize = 65536;
      for (let i = 0; i < base64.length; i += chunkSize) {
        wsRef.current.send(
          JSON.stringify({
            type: "audio_chunk",
            data: base64.slice(i, i + chunkSize),
          })
        );
      }
      wsRef.current.send(JSON.stringify({ type: "audio_end" }));
      setState((s) => ({ ...s, stage: "thinking" }));
    } else {
      setState((s) => ({ ...s, stage: "idle" }));
    }
  }, [state.stage]);

  // Send command (repeat, slower, switch_language)
  const sendCommand = useCallback(
    (action: string, value: string = "") => {
      if (!wsRef.current) return;
      wsRef.current.send(
        JSON.stringify({ type: "command", action, value })
      );
      setState((s) => ({ ...s, stage: "thinking" }));
    },
    []
  );

  // Register amplitude callback for lip-sync
  const onAmplitude = useCallback((callback: (amp: number) => void) => {
    amplitudeCallbackRef.current = callback;
    audioManagerRef.current.onAmplitude(callback);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }));
      wsRef.current.close();
      wsRef.current = null;
    }
    audioManagerRef.current.cleanup();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendCommand,
    onAmplitude,
  };
}
