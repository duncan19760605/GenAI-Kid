"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auto-redirect if session already exists
    if (api.getKidToken()) {
      router.replace("/kid/play");
      return;
    }
    if (api.getToken()) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
        <div className="animate-pulse text-4xl">🌟</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100 p-6">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h1 className="text-4xl font-bold text-orange-600 mb-2">Genius GenAI</h1>
        <p className="text-gray-500 text-lg">你好！請選擇你的身份</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <button
          onClick={() => router.push("/auth/kid")}
          className="flex-1 flex flex-col items-center gap-3 p-8 rounded-3xl bg-white shadow-lg border-4 border-yellow-300 hover:border-yellow-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
        >
          <span className="text-6xl">🧸</span>
          <span className="text-2xl font-bold text-yellow-600">我是小朋友</span>
          <span className="text-sm text-gray-400">用密碼登入</span>
        </button>

        <button
          onClick={() => router.push("/login")}
          className="flex-1 flex flex-col items-center gap-3 p-8 rounded-3xl bg-white shadow-lg border-4 border-blue-300 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
        >
          <span className="text-6xl">👨‍👩‍👧</span>
          <span className="text-2xl font-bold text-blue-600">我是大人</span>
          <span className="text-sm text-gray-400">家長管理後台</span>
        </button>
      </div>
    </div>
  );
}
