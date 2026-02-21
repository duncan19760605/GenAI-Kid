const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface KidSession {
  childId: string;
  childName: string;
  characterId: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  getToken() {
    return this.token;
  }

  getKidToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kid_token");
    }
    return null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Error ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ access_token: string }>("/api/parent/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ access_token: string }>("/api/parent/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string | null; timezone: string }>("/api/parent/auth/me");
  }

  // Children
  async listChildren() {
    return this.request<Child[]>("/api/parent/children");
  }

  async createChild(data: CreateChildRequest) {
    return this.request<Child>("/api/parent/children", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateChild(id: string, data: Partial<CreateChildRequest>) {
    return this.request<Child>(`/api/parent/children/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Providers
  async listProviders() {
    return this.request<ProviderConfig[]>("/api/parent/providers");
  }

  async upsertProvider(data: CreateProviderRequest) {
    return this.request<ProviderConfig>("/api/parent/providers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Usage
  async getDailyUsage(days = 7) {
    return this.request<DailyUsage[]>(`/api/parent/usage/daily?days=${days}`);
  }

  async getUsageSummary() {
    return this.request<UsageSummary>("/api/parent/usage/summary");
  }

  // Conversations
  async listConversations(childId?: string, limit = 20) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (childId) params.set("child_id", childId);
    return this.request<Conversation[]>(`/api/parent/conversations?${params}`);
  }

  async getConversation(id: string) {
    return this.request<ConversationDetail>(`/api/parent/conversations/${id}`);
  }

  // Kid auth
  async loginWithCode(code: string): Promise<KidSession> {
    const res = await fetch(`${API_BASE}/api/kid/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_code: code }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Error ${res.status}`);
    }
    const data = await res.json() as {
      access_token: string;
      child_name: string;
      child_id: string;
      character_id: string;
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("kid_token", data.access_token);
      const session: KidSession = {
        childId: data.child_id,
        childName: data.child_name,
        characterId: data.character_id,
      };
      localStorage.setItem("kid_session", JSON.stringify(session));
    }
    return {
      childId: data.child_id,
      childName: data.child_name,
      characterId: data.character_id,
    };
  }
}

// Types
export interface Child {
  id: string;
  name: string;
  age: number;
  primary_language: string;
  learning_languages: string[];
  character_id: string;
  login_code: string | null;
}

export interface CreateChildRequest {
  name: string;
  age: number;
  primary_language?: string;
  learning_languages?: string[];
  character_id?: string;
}

export interface ProviderConfig {
  id: string;
  provider_type: string;
  provider_name: string;
  model_name: string | null;
  config_json: Record<string, unknown>;
  is_active: boolean;
  has_api_key: boolean;
}

export interface CreateProviderRequest {
  provider_type: string;
  provider_name: string;
  api_key?: string;
  model_name?: string;
  config_json?: Record<string, unknown>;
}

export interface DailyUsage {
  date: string;
  total_sessions: number;
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  llm_tokens: number;
  tts_chars: number;
  stt_seconds: number;
}

export interface UsageSummary {
  total_sessions: number;
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  days_active: number;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  language: string | null;
  emotion: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  language: string | null;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export const api = new ApiClient();
