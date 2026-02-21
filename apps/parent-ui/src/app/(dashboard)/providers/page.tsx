"use client";

import { useEffect, useState } from "react";
import { api, ProviderConfig } from "@/lib/api";

const PROVIDER_OPTIONS = [
  {
    type: "llm",
    label: "Language Model (LLM)",
    icon: "🧠",
    providers: [
      { name: "openai", label: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
      { name: "anthropic", label: "Anthropic", models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"] },
    ],
  },
  {
    type: "stt",
    label: "Speech-to-Text (STT)",
    icon: "🎤",
    providers: [
      { name: "openai_whisper", label: "OpenAI Whisper", models: ["whisper-1"] },
    ],
  },
  {
    type: "tts",
    label: "Text-to-Speech (TTS)",
    icon: "🔊",
    providers: [
      { name: "openai_tts", label: "OpenAI TTS", models: ["tts-1", "tts-1-hd"] },
    ],
  },
  {
    type: "image",
    label: "Image Generation",
    icon: "🎨",
    providers: [
      { name: "wavespeed", label: "WaveSpeed AI", models: ["wavespeed-ai/z-image/turbo-lora"] },
    ],
  },
];

export default function ProvidersPage() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { provider_name: string; api_key: string; model_name: string }>>({});
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.listProviders().then((c) => {
      setConfigs(c);
      const data: typeof formData = {};
      for (const opt of PROVIDER_OPTIONS) {
        const existing = c.find((cfg) => cfg.provider_type === opt.type && cfg.is_active);
        data[opt.type] = {
          provider_name: existing?.provider_name || opt.providers[0].name,
          api_key: "",
          model_name: existing?.model_name || opt.providers[0].models[0],
        };
      }
      setFormData(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (type: string) => {
    const data = formData[type];
    if (!data) return;
    setSaving(type);
    try {
      await api.upsertProvider({
        provider_type: type,
        provider_name: data.provider_name,
        api_key: data.api_key || undefined,
        model_name: data.model_name,
      });
      const updated = await api.listProviders();
      setConfigs(updated);
      setSuccess(type);
      setTimeout(() => setSuccess(null), 2000);
      setFormData((prev) => ({
        ...prev,
        [type]: { ...prev[type], api_key: "" },
      }));
    } catch {
      // error handled silently
    }
    setSaving(null);
  };

  const getExistingConfig = (type: string) => configs.find((c) => c.provider_type === type && c.is_active);

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">AI Providers</h1>
        <p className="text-gray-500 text-sm mt-1">Configure API keys and models for each service</p>
      </div>

      {PROVIDER_OPTIONS.map((opt) => {
        const existing = getExistingConfig(opt.type);
        const data = formData[opt.type];
        if (!data) return null;

        const selectedProvider = opt.providers.find((p) => p.name === data.provider_name) || opt.providers[0];

        return (
          <div key={opt.type} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <h2 className="font-semibold text-gray-800">{opt.label}</h2>
                {existing ? (
                  <p className="text-xs text-green-500">
                    Active: {existing.provider_name} / {existing.model_name}
                    {existing.has_api_key ? " (API key set)" : " (no API key)"}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Not configured</p>
                )}
              </div>
            </div>

            {success === opt.type && (
              <div className="bg-green-50 text-green-600 text-sm rounded-lg p-2 mb-3">Saved!</div>
            )}

            <div className="space-y-3">
              {opt.providers.length > 1 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Provider</label>
                  <select
                    value={data.provider_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [opt.type]: {
                          ...prev[opt.type],
                          provider_name: e.target.value,
                          model_name: opt.providers.find((p) => p.name === e.target.value)?.models[0] || "",
                        },
                      }))
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm"
                  >
                    {opt.providers.map((p) => (
                      <option key={p.name} value={p.name}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Model</label>
                <select
                  value={data.model_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [opt.type]: { ...prev[opt.type], model_name: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm"
                >
                  {selectedProvider.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  API Key {existing?.has_api_key && <span className="text-green-500">(already set, enter new to replace)</span>}
                </label>
                <input
                  type="password"
                  value={data.api_key}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [opt.type]: { ...prev[opt.type], api_key: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm"
                  placeholder="sk-..."
                />
              </div>

              <button
                onClick={() => handleSave(opt.type)}
                disabled={saving === opt.type}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {saving === opt.type ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
