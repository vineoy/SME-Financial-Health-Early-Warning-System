"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { pct } from "@/lib/format";

export function TrendChart({ data }: { data: { risk_score: number; created_at: string }[] }) {
  const rows = data.map((d) => ({
    t: new Date(d.created_at).toLocaleDateString(),
    risk: +(d.risk_score * 100).toFixed(1),
  }));
  if (rows.length < 1) return <p className="text-sm text-gray-500">No assessments yet — add the first one.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <XAxis dataKey="t" fontSize={11} />
        <YAxis domain={[0, 100]} fontSize={11} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip formatter={(v) => [`${v}%`, "Risk"]} />
        <ReferenceLine y={20} stroke="#16a34a" strokeDasharray="4 4" />
        <ReferenceLine y={50} stroke="#eab308" strokeDasharray="4 4" />
        <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="risk" stroke="#111827" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HealthNote({ score }: { score: number }) {
  return <p className="text-xs text-gray-500">Risk {pct(score)} · bands 20 / 50 / 75</p>;
}
