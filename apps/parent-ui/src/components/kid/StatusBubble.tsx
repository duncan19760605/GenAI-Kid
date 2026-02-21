"use client";

import type { SessionStage } from "@/hooks/useVoiceSession";

interface StatusBubbleProps {
  stage: SessionStage;
  transcript: string;
}

const STAGE_TEXT: Record<string, string> = {
  idle: "",
  recording: "🎤 ...",
  listening: "👂 ...",
  thinking: "🤔 ...",
  speaking: "",
  error: "😅",
};

export function StatusBubble({ stage, transcript }: StatusBubbleProps) {
  const showTranscript = stage === "speaking" && transcript;
  const stageText = STAGE_TEXT[stage] || "";

  if (!showTranscript && !stageText) return null;

  return (
    <div className="flex flex-col items-center mb-2">
      <div
        className="bg-white rounded-2xl px-5 py-3 shadow-md max-w-xs text-center"
        style={{ maxWidth: 280 }}
      >
        <p className="text-base text-gray-700 leading-snug">
          {showTranscript ? transcript : stageText}
        </p>
      </div>
      {/* Tail */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid white",
        }}
      />
    </div>
  );
}
