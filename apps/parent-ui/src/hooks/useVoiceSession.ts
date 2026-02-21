"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "@/lib/api";
import { WebAudioManager, WebRecordingManager } from "@/services/webAudioManager";

export type SessionStage =
  | "idle"
  | "recording"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

interface VoiceSessionOptions {
  childId: string;
  token: string;
  language: string;
}

interface VoiceSessionState {
  stage: SessionStage;
  emotion: string;
  mouthOpen: number;
  transcript: string;
  error: string | null;
}

interface VoiceSessionActions {
  startRecording: () => void;
  stopRecording: () => void;
  sendCommand: (action: string, value?: string) => void;
  endSession: () => void;
}

const CHUNK_SIZE = 64 * 1024; // 64KB for sending base64 audio

export function useVoiceSession(
  options: VoiceSessionOptions
): VoiceSessionState & VoiceSessionActions {
  const [stage, setStage] = useState<SessionStage>("idle");
  const [emotion, setEmotion] = useState("happy");
  const [mouthOpen, setMouthOpen] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioManagerRef = useRef(new WebAudioManager());
  const recorderRef = useRef(new WebRecordingManager());
  const audioFormatRef = useRef("mp3");

  // Connect WebSocket
  useEffect(() => {
    const { childId, token } = options;
    const url = `${WS_BASE}/ws/voice/${childId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const audioManager = audioManagerRef.current;
    audioManager.onAmplitude = (v) => setMouthOpen(v);
    audioManager.onPlaybackEnd = () => setStage("idle");

    ws.onmessage = async (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const type = msg.type as string;

      if (type === "session_started") {
        setStage("idle");
      } else if (type === "processing") {
        const s = msg.stage as string;
        if (s === "listening") setStage("listening");
        else if (s === "thinking") setStage("thinking");
      } else if (type === "response_start") {
        setStage("speaking");
        setEmotion((msg.emotion as string) || "happy");
        const fmt = (msg.format as string) || "mp3";
        audioFormatRef.current = fmt;
        audioManager.beginReceiving(fmt);
      } else if (type === "audio_chunk") {
        audioManager.receiveChunk(msg.data as string);
      } else if (type === "audio_end") {
        setTranscript((msg.transcript as string) || "");
        await audioManager.play();
      } else if (type === "error") {
        setError((msg.message as string) || "Unknown error");
        setStage("error");
      }
    };

    ws.onerror = () => {
      setError("連線失敗，請重新整理頁面");
      setStage("error");
    };

    ws.onclose = () => {
      if (stage !== "error") setStage("idle");
    };

    return () => {
      ws.close();
      audioManager.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.childId, options.token]);

  const sendWs = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (stage !== "idle") return;
    try {
      await recorderRef.current.start();
      setStage("recording");
      sendWs({ type: "audio_start" });
    } catch {
      setError("麥克風權限被拒絕");
      setStage("error");
    }
  }, [stage, sendWs]);

  const stopRecording = useCallback(async () => {
    if (stage !== "recording") return;
    setStage("listening");
    try {
      const base64 = await recorderRef.current.stop();
      // Send in chunks
      for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
        sendWs({ type: "audio_chunk", data: base64.slice(i, i + CHUNK_SIZE) });
      }
      sendWs({ type: "audio_end" });
    } catch {
      setError("錄音失敗");
      setStage("error");
    }
  }, [stage, sendWs]);

  const sendCommand = useCallback(
    (action: string, value?: string) => {
      sendWs({ type: "command", action, value: value ?? "" });
    },
    [sendWs]
  );

  const endSession = useCallback(() => {
    sendWs({ type: "end_session" });
    wsRef.current?.close();
  }, [sendWs]);

  return {
    stage,
    emotion,
    mouthOpen,
    transcript,
    error,
    startRecording,
    stopRecording,
    sendCommand,
    endSession,
  };
}
