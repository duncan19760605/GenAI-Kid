"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Conversation, Child } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listConversations(undefined, 50), api.listChildren()])
      .then(([convs, kids]) => {
        setConversations(convs);
        setChildren(kids);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = (childId: string) => {
    setSelectedChild(childId);
    setLoading(true);
    api
      .listConversations(childId || undefined, 50)
      .then(setConversations)
      .finally(() => setLoading(false));
  };

  const getChildName = (childId: string) => children.find((c) => c.id === childId)?.name || "Unknown";

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    return mins < 1 ? "<1 min" : `${mins} min`;
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Conversations</h1>
        <p className="text-gray-500 text-sm mt-1">Review your children&apos;s conversation history</p>
      </div>

      {/* Filter by child */}
      {children.length > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => handleFilter("")}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              !selectedChild ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500"
            }`}
          >
            All
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => handleFilter(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                selectedChild === c.id ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Conversations list */}
      <div className="space-y-3">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/conversations/${conv.id}`}
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-gray-800">{getChildName(conv.child_id)}</p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(conv.started_at), "MMM dd, yyyy h:mm a")}
                    {" · "}
                    {formatDuration(conv.started_at, conv.ended_at)}
                    {conv.language && ` · ${conv.language.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{conv.total_tokens.toLocaleString()} tokens</p>
                <p className="text-xs text-gray-400">${conv.estimated_cost_usd.toFixed(4)}</p>
              </div>
            </div>
          </Link>
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl block mb-4">💬</span>
            <p>No conversations yet. Start talking with the Kid app!</p>
          </div>
        )}
      </div>
    </div>
  );
}
