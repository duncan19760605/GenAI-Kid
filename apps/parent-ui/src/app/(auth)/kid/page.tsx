"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function KidLoginPage() {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const { childLogin } = useAuth();
  const router = useRouter();

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // only single digit
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5) {
      const code = [...next.slice(0, 5), value].join("");
      if (code.length === 6) submit(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const submit = async (code?: string) => {
    const finalCode = code ?? digits.join("");
    if (finalCode.length !== 6) {
      setError("請輸入 6 位數字密碼");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await childLogin(finalCode);
    } catch {
      setError("密碼不對，請再試一次 😅");
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 p-6">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 text-3xl"
      >
        ←
      </button>

      <div className="text-center mb-10">
        <div className="text-7xl mb-4 animate-bounce">🧸</div>
        <h1 className="text-3xl font-bold text-orange-500 mb-2">小朋友登入</h1>
        <p className="text-gray-500">輸入你的 6 位數字密碼</p>
      </div>

      <div className="flex gap-3 mb-8">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-14 h-16 text-center text-3xl font-bold rounded-2xl border-4 outline-none transition-all
              ${d ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-700"}
              focus:border-orange-400 focus:bg-orange-50`}
            disabled={loading}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-2xl text-red-500 text-center font-medium">
          {error}
        </div>
      )}

      <button
        onClick={() => submit()}
        disabled={loading || digits.some((d) => !d)}
        className="px-10 py-4 bg-orange-400 hover:bg-orange-500 text-white text-xl font-bold rounded-full shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        {loading ? "登入中..." : "出發！🚀"}
      </button>
    </div>
  );
}
