"use client";

interface RoundControlsProps {
  onRepeat: () => void;
  onSlower: () => void;
  onSwitchLanguage: (lang: string) => void;
  onDontUnderstand: () => void;
  currentLanguage: string;
  availableLanguages: string[];
  disabled: boolean;
}

const LANG_FLAGS: Record<string, string> = {
  zh: "🇹🇼",
  en: "🇺🇸",
  es: "🇪🇸",
};

const LANG_LABELS: Record<string, string> = {
  zh: "中文",
  en: "ABC",
  es: "ESP",
};

export function RoundControls({
  onRepeat,
  onSlower,
  onSwitchLanguage,
  onDontUnderstand,
  currentLanguage,
  availableLanguages,
  disabled,
}: RoundControlsProps) {
  const allLangs = [currentLanguage, ...availableLanguages.filter((l) => l !== currentLanguage)];
  const nextLang = allLangs[(allLangs.indexOf(currentLanguage) + 1) % allLangs.length];

  const btn = (emoji: string, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-full bg-white shadow-md transition-all disabled:opacity-40 hover:shadow-lg active:scale-90"
      style={{ width: 64, height: 64, fontSize: 26 }}
    >
      <span>{emoji}</span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex gap-4 items-center justify-center">
      {btn("🔁", "再說", onRepeat)}
      {btn("🐢", "慢點", onSlower)}
      <button
        onClick={() => !disabled && onSwitchLanguage(nextLang)}
        disabled={disabled}
        className="flex flex-col items-center gap-1 rounded-full bg-white shadow-md transition-all disabled:opacity-40 hover:shadow-lg active:scale-90"
        style={{ width: 64, height: 64 }}
      >
        <span style={{ fontSize: 26 }}>{LANG_FLAGS[nextLang] || "🌐"}</span>
        <span className="text-xs text-gray-500 font-medium">{LANG_LABELS[nextLang] || nextLang}</span>
      </button>
      {btn("❓", "不懂", onDontUnderstand)}
    </div>
  );
}
