import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";

const TOKEN_KEY = "companion_token";
const CHILD_KEY = "companion_child";

export interface ChildSession {
  token: string;
  childName: string;
  childId: string;
  characterId: string;
}

async function request(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function loginWithCode(code: string): Promise<ChildSession> {
  const data = await request("/api/kid/auth/login", {
    method: "POST",
    body: JSON.stringify({ login_code: code }),
  });

  const session: ChildSession = {
    token: data.access_token,
    childName: data.child_name,
    childId: data.child_id || "",
    characterId: data.character_id,
  };

  await AsyncStorage.setItem(TOKEN_KEY, session.token);
  await AsyncStorage.setItem(CHILD_KEY, JSON.stringify(session));
  return session;
}

export async function getStoredSession(): Promise<ChildSession | null> {
  const raw = await AsyncStorage.getItem(CHILD_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, CHILD_KEY]);
}
