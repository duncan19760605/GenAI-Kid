"use client";

import { useEffect, useRef, useState } from "react";

interface CharacterViewProps {
  characterId: string;
  emotion: string;
  mouthOpen: number; // 0 to 1
  isSpeaking: boolean;
  isListening: boolean;
}

const EMOTION_GLOW: Record<string, string> = {
  happy: "#FFD93D",
  curious: "#74B9FF",
  sad: "#A29BFE",
  excited: "#FD79A8",
  encouraging: "#55EFC4",
  empathetic: "#A29BFE",
  patient: "#74B9FF",
  gentle: "#55EFC4",
  neutral: "#FDCB6E",
};

function getEyeStyle(emotion: string): "normal" | "happy" | "sad" | "wide" {
  switch (emotion) {
    case "happy":
    case "encouraging":
    case "proud":
      return "happy";
    case "sad":
    case "empathetic":
    case "gentle":
      return "sad";
    case "excited":
    case "curious":
      return "wide";
    default:
      return "normal";
  }
}

export function CharacterView({
  characterId,
  emotion,
  mouthOpen,
  isSpeaking,
  isListening,
}: CharacterViewProps) {
  const glowColor = EMOTION_GLOW[emotion] || "#FDCB6E";
  const [popScale, setPopScale] = useState(1);
  const prevEmotion = useRef(emotion);

  useEffect(() => {
    if (prevEmotion.current !== emotion) {
      prevEmotion.current = emotion;
      setPopScale(1.08);
      const t = setTimeout(() => setPopScale(1), 200);
      return () => clearTimeout(t);
    }
  }, [emotion]);

  const animClass = isSpeaking ? "animate-kid-bounce" : "animate-kid-breathe";

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow */}
      <div
        className="absolute rounded-full opacity-25 pointer-events-none"
        style={{
          width: 240,
          height: 240,
          backgroundColor: glowColor,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "background-color 0.5s",
        }}
      />

      {/* Character */}
      <div
        className={animClass}
        style={{ transform: `scale(${popScale})`, transition: "transform 200ms" }}
      >
        {characterId === "bear" && (
          <BearSvg emotion={emotion} mouthOpen={mouthOpen} />
        )}
        {characterId === "rabbit" && (
          <RabbitSvg emotion={emotion} mouthOpen={mouthOpen} />
        )}
        {characterId === "cat" && (
          <CatSvg emotion={emotion} mouthOpen={mouthOpen} />
        )}
      </div>

      {/* Listening dots */}
      {isListening && (
        <div className="flex gap-2 mt-3">
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </div>
      )}
    </div>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  return (
    <div
      className="w-3 h-3 rounded-full bg-orange-400 animate-kid-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function BearSvg({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eye = getEyeStyle(emotion);
  const mouthH = 8 + mouthOpen * 20;
  const mouthRx = 12 + mouthOpen * 4;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="50" cy="40" r="28" fill="#C49A6C" />
      <circle cx="50" cy="40" r="18" fill="#E8C9A0" />
      <circle cx="150" cy="40" r="28" fill="#C49A6C" />
      <circle cx="150" cy="40" r="18" fill="#E8C9A0" />
      <ellipse cx="100" cy="115" rx="72" ry="78" fill="#C49A6C" />
      <ellipse cx="100" cy="120" rx="50" ry="48" fill="#E8C9A0" />

      {eye === "normal" && (
        <>
          <circle cx="75" cy="95" r="8" fill="#5D4037" />
          <circle cx="125" cy="95" r="8" fill="#5D4037" />
          <circle cx="78" cy="92" r="3" fill="white" />
          <circle cx="128" cy="92" r="3" fill="white" />
        </>
      )}
      {eye === "happy" && (
        <>
          <path d="M 67 95 Q 75 85 83 95" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 117 95 Q 125 85 133 95" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {eye === "sad" && (
        <>
          <circle cx="75" cy="98" r="7" fill="#5D4037" />
          <circle cx="125" cy="98" r="7" fill="#5D4037" />
          <path d="M 63 85 Q 73 82 83 88" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 137 85 Q 127 82 117 88" stroke="#5D4037" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {eye === "wide" && (
        <>
          <circle cx="75" cy="95" r="10" fill="#5D4037" />
          <circle cx="125" cy="95" r="10" fill="#5D4037" />
          <circle cx="78" cy="91" r="4" fill="white" />
          <circle cx="128" cy="91" r="4" fill="white" />
        </>
      )}

      <ellipse cx="100" cy="110" rx="6" ry="5" fill="#8D6E63" />
      <ellipse cx="100" cy={118 + mouthH / 4} rx={mouthRx} ry={mouthH / 2} fill="#D4836B" />

      {(emotion === "happy" || emotion === "excited") && (
        <>
          <ellipse cx="58" cy="110" rx="12" ry="7" fill="#FFCDD2" opacity={0.6} />
          <ellipse cx="142" cy="110" rx="12" ry="7" fill="#FFCDD2" opacity={0.6} />
        </>
      )}
      {emotion === "excited" && (
        <>
          <path d="M 40 60 L 43 55 L 46 60 L 42 57 L 48 57 Z" fill="#FFD93D" />
          <path d="M 155 55 L 158 50 L 161 55 L 157 52 L 163 52 Z" fill="#FFD93D" />
        </>
      )}
    </svg>
  );
}

function RabbitSvg({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eye = getEyeStyle(emotion);
  const mouthH = 6 + mouthOpen * 16;

  return (
    <svg width="200" height="220" viewBox="0 0 200 220">
      <ellipse cx="70" cy="30" rx="16" ry="50" fill="#F5F5F5" />
      <ellipse cx="70" cy="30" rx="10" ry="40" fill="#FFCDD2" />
      <ellipse cx="130" cy="25" rx="16" ry="50" fill="#F5F5F5" transform="rotate(10, 130, 25)" />
      <ellipse cx="130" cy="25" rx="10" ry="40" fill="#FFCDD2" transform="rotate(10, 130, 25)" />
      <circle cx="100" cy="120" r="65" fill="#F5F5F5" />
      <ellipse cx="100" cy="130" rx="40" ry="35" fill="white" />

      {eye === "normal" && (
        <>
          <circle cx="78" cy="108" r="7" fill="#E91E63" />
          <circle cx="122" cy="108" r="7" fill="#E91E63" />
          <circle cx="80" cy="106" r="2.5" fill="white" />
          <circle cx="124" cy="106" r="2.5" fill="white" />
        </>
      )}
      {eye === "happy" && (
        <>
          <path d="M 71 108 Q 78 100 85 108" stroke="#E91E63" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 115 108 Q 122 100 129 108" stroke="#E91E63" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {eye === "sad" && (
        <>
          <circle cx="78" cy="112" r="6" fill="#E91E63" />
          <circle cx="122" cy="112" r="6" fill="#E91E63" />
        </>
      )}
      {eye === "wide" && (
        <>
          <circle cx="78" cy="108" r="9" fill="#E91E63" />
          <circle cx="122" cy="108" r="9" fill="#E91E63" />
          <circle cx="80" cy="105" r="3.5" fill="white" />
          <circle cx="124" cy="105" r="3.5" fill="white" />
        </>
      )}

      <ellipse cx="100" cy="125" rx="5" ry="4" fill="#FF8A80" />
      <path d="M 60 125 L 82 128" stroke="#BDBDBD" strokeWidth="1.5" />
      <path d="M 58 132 L 80 132" stroke="#BDBDBD" strokeWidth="1.5" />
      <path d="M 118 128 L 140 125" stroke="#BDBDBD" strokeWidth="1.5" />
      <path d="M 120 132 L 142 132" stroke="#BDBDBD" strokeWidth="1.5" />
      <ellipse cx="100" cy={133 + mouthH / 4} rx={8 + mouthOpen * 3} ry={mouthH / 2} fill="#FF8A80" />

      {(emotion === "happy" || emotion === "excited") && (
        <>
          <ellipse cx="60" cy="122" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
          <ellipse cx="140" cy="122" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
        </>
      )}
    </svg>
  );
}

function CatSvg({ emotion, mouthOpen }: { emotion: string; mouthOpen: number }) {
  const eye = getEyeStyle(emotion);
  const mouthH = 6 + mouthOpen * 16;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <path d="M 45 75 L 30 20 L 72 60 Z" fill="#FFB74D" />
      <path d="M 50 70 L 38 30 L 68 60 Z" fill="#FFCC80" />
      <path d="M 155 75 L 170 20 L 128 60 Z" fill="#FFB74D" />
      <path d="M 150 70 L 162 30 L 132 60 Z" fill="#FFCC80" />
      <circle cx="100" cy="110" r="62" fill="#FFB74D" />
      <ellipse cx="100" cy="118" rx="42" ry="36" fill="#FFCC80" />

      {eye === "normal" && (
        <>
          <ellipse cx="78" cy="100" rx="8" ry="9" fill="#4CAF50" />
          <ellipse cx="78" cy="100" rx="3" ry="8" fill="#1B5E20" />
          <ellipse cx="122" cy="100" rx="8" ry="9" fill="#4CAF50" />
          <ellipse cx="122" cy="100" rx="3" ry="8" fill="#1B5E20" />
        </>
      )}
      {eye === "happy" && (
        <>
          <path d="M 70 100 Q 78 92 86 100" stroke="#1B5E20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 114 100 Q 122 92 130 100" stroke="#1B5E20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {eye === "sad" && (
        <>
          <ellipse cx="78" cy="103" rx="7" ry="8" fill="#4CAF50" />
          <ellipse cx="78" cy="103" rx="2.5" ry="7" fill="#1B5E20" />
          <ellipse cx="122" cy="103" rx="7" ry="8" fill="#4CAF50" />
          <ellipse cx="122" cy="103" rx="2.5" ry="7" fill="#1B5E20" />
        </>
      )}
      {eye === "wide" && (
        <>
          <circle cx="78" cy="100" r="10" fill="#4CAF50" />
          <circle cx="78" cy="100" r="5" fill="#1B5E20" />
          <circle cx="122" cy="100" r="10" fill="#4CAF50" />
          <circle cx="122" cy="100" r="5" fill="#1B5E20" />
        </>
      )}

      <path d="M 97 115 L 100 112 L 103 115 Z" fill="#E65100" />
      <path d="M 55 112 L 80 115" stroke="#8D6E63" strokeWidth="1.5" />
      <path d="M 53 120 L 78 120" stroke="#8D6E63" strokeWidth="1.5" />
      <path d="M 57 128 L 80 124" stroke="#8D6E63" strokeWidth="1.5" />
      <path d="M 120 115 L 145 112" stroke="#8D6E63" strokeWidth="1.5" />
      <path d="M 122 120 L 147 120" stroke="#8D6E63" strokeWidth="1.5" />
      <path d="M 120 124 L 143 128" stroke="#8D6E63" strokeWidth="1.5" />
      <ellipse cx="100" cy={120 + mouthH / 4} rx={7 + mouthOpen * 3} ry={mouthH / 2} fill="#E65100" opacity={0.7} />

      {(emotion === "happy" || emotion === "excited") && (
        <>
          <ellipse cx="58" cy="112" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
          <ellipse cx="142" cy="112" rx="10" ry="6" fill="#FFCDD2" opacity={0.5} />
        </>
      )}
    </svg>
  );
}
