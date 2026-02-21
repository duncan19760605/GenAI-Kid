"use client";

import { useEffect, useState } from "react";
import { api, DailyUsage, UsageSummary, Child } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [daily, setDaily] = useState<DailyUsage[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getUsageSummary(), api.getDailyUsage(14), api.listChildren()])
      .then(([s, d, c]) => {
        setSummary(s);
        setDaily(d.reverse());
        setChildren(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse text-gray-400 text-lg">Loading dashboard...</div>;
  }

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your children&apos;s learning activity</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎯" label="Total Sessions" value={summary?.total_sessions ?? 0} />
        <StatCard icon="⏱" label="Total Time" value={formatDuration(summary?.total_duration_ms ?? 0)} />
        <StatCard icon="🪙" label="Total Tokens" value={(summary?.total_tokens ?? 0).toLocaleString()} />
        <StatCard icon="💰" label="Total Cost" value={`$${(summary?.total_cost_usd ?? 0).toFixed(2)}`} />
      </div>

      {/* Usage chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Sessions (Last 14 Days)</h2>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MM/dd")}
                fontSize={12}
                stroke="#9ca3af"
              />
              <YAxis fontSize={12} stroke="#9ca3af" />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), "MMM dd, yyyy")}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  if (name === "total_cost_usd") return [`$${Number(value).toFixed(4)}`, "Cost"];
                  if (name === "total_sessions") return [value, "Sessions"];
                  return [value, name];
                }}
              />
              <Bar dataKey="total_sessions" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-12">No usage data yet. Start a conversation!</p>
        )}
      </div>

      {/* Children list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Children</h2>
        {children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div key={child.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {child.character_id === "bear" ? "🐻" : child.character_id === "rabbit" ? "🐰" : "🐱"}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">{child.name}</p>
                    <p className="text-xs text-gray-400">Age {child.age} · {child.primary_language.toUpperCase()}</p>
                  </div>
                </div>
                {child.login_code && (
                  <div className="mt-3 bg-orange-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-gray-500">Login Code</p>
                    <p className="text-lg font-mono font-bold text-orange-600 tracking-widest">{child.login_code}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No children added yet. Go to <span className="font-medium">Children</span> to add one.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
