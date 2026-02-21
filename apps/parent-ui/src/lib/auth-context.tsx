"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface User {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
}

export interface KidUser {
  childId: string;
  childName: string;
  characterId: string;
}

interface AuthContextType {
  user: User | null;
  kidUser: KidUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  childLogin: (code: string) => Promise<void>;
  childLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [kidUser, setKidUser] = useState<KidUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore kid session from localStorage
    if (typeof window !== "undefined") {
      const kidSession = localStorage.getItem("kid_session");
      if (kidSession) {
        try {
          setKidUser(JSON.parse(kidSession));
        } catch {
          localStorage.removeItem("kid_session");
          localStorage.removeItem("kid_token");
        }
      }
    }

    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then(setUser)
        .catch(() => api.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const me = await api.getMe();
    setUser(me);
    router.push("/dashboard");
  };

  const register = async (email: string, password: string, name?: string) => {
    await api.register(email, password, name);
    const me = await api.getMe();
    setUser(me);
    router.push("/dashboard");
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    router.push("/login");
  };

  const childLogin = async (code: string) => {
    const session = await api.loginWithCode(code);
    setKidUser(session);
    router.push("/kid/play");
  };

  const childLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kid_token");
      localStorage.removeItem("kid_session");
    }
    setKidUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, kidUser, loading, login, register, logout, childLogin, childLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
