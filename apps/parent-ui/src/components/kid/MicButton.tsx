"use client";

interface MicButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function MicButton({ isRecording, isDisabled, onPressIn, onPressOut }: MicButtonProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {/* Pulse ring */}
      {isRecording && (
        <div
          className="absolute rounded-full animate-kid-mic-pulse"
          style={{
            width: 96,
            height: 96,
            backgroundColor: "#FF6B6B",
            opacity: 0.3,
          }}
        />
      )}

      {/* Button */}
      <button
        onMouseDown={onPressIn}
        onMouseUp={onPressOut}
        onTouchStart={(e) => { e.preventDefault(); onPressIn(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressOut(); }}
        disabled={isDisabled}
        className="relative z-10 flex items-center justify-center rounded-full shadow-xl transition-all select-none"
        style={{
          width: 96,
          height: 96,
          backgroundColor: isRecording ? "#FF6B6B" : "#FF8E53",
          opacity: isDisabled ? 0.5 : 1,
          transform: isRecording ? "scale(1.08)" : "scale(1)",
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        <span className="text-4xl">{isRecording ? "🎤" : "🎙️"}</span>
      </button>
    </div>
  );
}
