"use client";
import { BAND, Band, pct } from "@/lib/format";

export function BandBadge({ band, score }: { band: Band; score?: number }) {
  const b = BAND[band];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: b.bg, color: b.color }}
    >
      {b.label}
      {score !== undefined && <span>· {pct(score)}</span>}
    </span>
  );
}

// Semicircle risk gauge. Same component on dashboard + detail (viz spec consistency).
export function Gauge({ score, size = 180 }: { score: number; size?: number }) {
  const band: Band = score < 0.2 ? "green" : score < 0.5 ? "yellow" : score < 0.75 ? "orange" : "red";
  const angle = Math.PI * (1 - Math.min(Math.max(score, 0), 1));
  const r = 70;
  const cx = 90;
  const cy = 90;
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);
  const arc = (a0: number, a1: number, color: string) => {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    return <path d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />;
  };
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 180 112">
      {arc(Math.PI, Math.PI * 0.8, "#16a34a")}
      {arc(Math.PI * 0.8, Math.PI * 0.5, "#eab308")}
      {arc(Math.PI * 0.5, Math.PI * 0.25, "#f97316")}
      {arc(Math.PI * 0.25, 0.001, "#dc2626")}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#111827" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#111827" />
      <text x={cx} y={108} textAnchor="middle" fontSize={20} fontWeight={700} fill={BAND[band].color}>
        {pct(score)}
      </text>
    </svg>
  );
}

export function FactorBars({ factors }: { factors: { feature: string; plain: string; value: number; pushes_risk_up: boolean }[] }) {
  return (
    <div className="space-y-2">
      {factors.map((f) => (
        <div key={f.feature} className="rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{f.plain}</span>
            <span className={`text-xs font-semibold ${f.pushes_risk_up ? "text-red-600" : "text-green-600"}`}>
              {f.pushes_risk_up ? "▲ pushes risk up" : "▼ pulls risk down"}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {f.feature} · value {f.value}
          </div>
        </div>
      ))}
    </div>
  );
}
