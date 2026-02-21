"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { api } from "@/lib/api";
import { CharacterView } from "@/components/kid/CharacterView";
import { MicButton } from "@/components/kid/MicButton";
import { RoundControls } from "@/components/kid/RoundControls";
import { StatusBubble } from "@/components/kid/StatusBubble";

const CHARACTER_BG: Record<string, string> = {
  bear: "from-orange-100 via-yellow-50 to-amber-100",
  rabbit: "from-pink-100 via-rose-50 to-purple-100",
  cat: "from-yellow-100 via-orange-50 to-amber-100",
};

const CHARACTER_NAMES: Record<string, string> = {
  bear: "小熊貝貝",
  rabbit: "小兔跳跳",
  cat: "小貓咪咪",
};

// Languages the character can switch between
const DEFAULT_LANGUAGES = ["zh", "en", "es"];

export default function KidPlayPage() {
  const { kidUser, childLogout } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState("zh");

  const token = api.getKidToken() ?? "";
  const childId = kidUser?.childId ?? "";
  const characterId = kidUser?.characterId ?? "bear";

  const {
    stage,
    emotion,
    mouthOpen,
    transcript,
    error,
    startRecording,
    stopRecording,
    sendCommand,
  } = useVoiceSession({ childId, token, language: currentLanguage });

  const handleSwitchLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    sendCommand("switch_language", lang);
  };

  const bg = CHARACTER_BG[characterId] || CHARACTER_BG.bear;

  return (
    <div className={`min-h-screen flex flex-col items-center bg-gradient-to-br ${bg} relative overflow-hidden`}>
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 pt-4 pb-2">
        <div className="text-lg font-bold text-gray-600">
          Hi, {kidUser?.childName}！👋
        </div>
        <button
          onClick={childLogout}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1 rounded-full hover:bg-white/50"
        >
          離開
        </button>
      </div>

      {/* Character name */}
      <div className="text-gray-500 text-sm font-medium mt-1 mb-4">
        {CHARACTER_NAMES[characterId] || characterId}
      </div>

      {/* Character area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
        <CharacterView
          characterId={characterId}
          emotion={emotion}
          mouthOpen={mouthOpen}
          isSpeaking={stage === "speaking"}
          isListening={stage === "listening"}
        />

        {/* Status bubble sits below the character */}
        <div style={{ minHeight: 60 }}>
          <StatusBubble stage={stage} transcript={transcript} />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col items-center gap-6 pb-10 px-4">
        {/* Mic button */}
        <MicButton
          isRecording={stage === "recording"}
          isDisabled={stage === "thinking" || stage === "speaking" || stage === "listening"}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        />

        {/* Round controls */}
        <RoundControls
          onRepeat={() => sendCommand("repeat")}
          onSlower={() => sendCommand("slower")}
          onSwitchLanguage={handleSwitchLanguage}
          onDontUnderstand={() => sendCommand("dont_understand")}
          currentLanguage={currentLanguage}
          availableLanguages={DEFAULT_LANGUAGES.filter((l) => l !== currentLanguage)}
          disabled={stage === "thinking" || stage === "recording" || stage === "listening"}
        />
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg text-center">
          {error}
        </div>
      )}
    </div>
  );
}
