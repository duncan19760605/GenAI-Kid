"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function KidLayout({ children }: { children: React.ReactNode }) {
  const { kidUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !kidUser) {
      router.replace("/auth/kid");
    }
  }, [kidUser, loading, router]);

  if (loading || !kidUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
        <div className="text-6xl animate-bounce">🌟</div>
      </div>
    );
  }

  return <>{children}</>;
}
