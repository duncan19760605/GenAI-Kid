"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Child, CreateChildRequest } from "@/lib/api";

const CHARACTERS = [
  { id: "bear", emoji: "🐻", label: "Bear" },
  { id: "rabbit", emoji: "🐰", label: "Rabbit" },
  { id: "cat", emoji: "🐱", label: "Cat" },
];

const LANGUAGES = [
  { code: "zh", label: "Chinese" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
];

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CreateChildRequest>({
    name: "",
    age: 5,
    primary_language: "zh",
    learning_languages: ["en"],
    character_id: "bear",
  });
  const [error, setError] = useState("");

  const load = () => {
    api.listChildren().then(setChildren).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.createChild(form);
      setShowForm(false);
      setForm({ name: "", age: 5, primary_language: "zh", learning_languages: ["en"], character_id: "bear" });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create child");
    }
  };

  const toggleLearningLang = (code: string) => {
    const langs = form.learning_languages || [];
    if (langs.includes(code)) {
      setForm({ ...form, learning_languages: langs.filter((l) => l !== code) });
    } else {
      setForm({ ...form, learning_languages: [...langs, code] });
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Children</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your children&apos;s profiles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
        >
          {showForm ? "Cancel" : "+ Add Child"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="Child's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <select
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none"
              >
                {[3, 4, 5, 6, 7, 8].map((a) => (
                  <option key={a} value={a}>{a} years old</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Character</label>
            <div className="flex gap-3">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm({ ...form, character_id: c.id })}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition ${
                    form.character_id === c.id
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="text-xs font-medium text-gray-600">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
              <select
                value={form.primary_language}
                onChange={(e) => setForm({ ...form, primary_language: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Learning Languages</label>
              <div className="flex gap-2">
                {LANGUAGES.filter((l) => l.code !== form.primary_language).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLearningLang(l.code)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      form.learning_languages?.includes(l.code)
                        ? "border-orange-400 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition"
          >
            Add Child
          </button>
        </form>
      )}

      {/* Children list */}
      <div className="space-y-4">
        {children.map((child) => (
          <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-5xl">
                  {child.character_id === "bear" ? "🐻" : child.character_id === "rabbit" ? "🐰" : "🐱"}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{child.name}</h3>
                  <p className="text-sm text-gray-500">
                    Age {child.age} · Primary: {child.primary_language.toUpperCase()} · Learning:{" "}
                    {child.learning_languages.map((l) => l.toUpperCase()).join(", ")}
                  </p>
                </div>
              </div>
              <Link
                href={`/children/${child.id}`}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                Edit
              </Link>
            </div>

            {child.login_code && (
              <div className="mt-4 flex items-center gap-4">
                <div className="bg-orange-50 rounded-xl px-5 py-3">
                  <p className="text-xs text-gray-500 mb-1">Login Code (give to child)</p>
                  <p className="text-2xl font-mono font-bold text-orange-600 tracking-[0.3em]">
                    {child.login_code}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {children.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl block mb-4">👶</span>
            <p>No children added yet. Click &quot;+ Add Child&quot; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
