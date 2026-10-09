"use client";
import { BAND, Band } from "@/lib/format";

const ADVICE: Record<Band, string> = {
  green: "No action needed. Check again next quarter to make sure it stays here.",
  yellow: "Stay alert. Look at your loans and cash this month.",
  orange: "Act soon. Cut unnecessary costs, collect pending dues, talk to your lender.",
  red: "Act now. Get professional financial advice immediately.",
};

// Plain-words signal explanation: "Out of 100 companies like yours, ~N face bankruptcy."
export function SignalExplainer({ score, band }: { score: number; band: Band }) {
  const perHundred = Math.max(1, Math.round(score * 100));
  const healthy = 100 - perHundred;
  return (
    <div className="rounded-xl border border-dashed p-4 text-sm">
      <p className="font-semibold">💡 What does this mean in simple words?</p>
      <p className="mt-1 text-gray-700">
        Out of <b>100 companies</b> with finances like yours, about <b>{perHundred}</b>{" "}
        would face bankruptcy and about <b>{healthy} stay healthy</b>. Your health is{" "}
        <b style={{ color: BAND[band].color }}>{healthy}%</b> and your status is{" "}
        <b style={{ color: BAND[band].color }}>{BAND[band].label}</b>.
      </p>
      <p className="mt-1 text-gray-700">👉 {ADVICE[band]}</p>
    </div>
  );
}

// Plain-words trend explanation based on direction of the line.
export function TrendExplainer({ rows }: { rows: { risk_score: number }[] }) {
  let msg: string;
  if (rows.length < 2) {
    msg = "This is your first checkup. Your starting point. Add one every 3 months. The line direction is your real early warning: going up means getting riskier, going down means improving.";
  } else {
    const delta = (rows[rows.length - 1].risk_score - rows[0].risk_score) * 100;
    if (delta > 5) msg = `Your risk rose ${delta.toFixed(1)} points since the first checkup. Things are getting riskier. Act before it crosses the next dashed line.`;
    else if (delta < -5) msg = `Your risk fell ${Math.abs(delta).toFixed(1)} points. What you are doing is working. Keep it up.`;
    else msg = "Your risk is almost flat. Stable. Keep checking every quarter to catch any turn early.";
  }
  return (
    <div className="rounded-xl border border-dashed p-4 text-sm">
      <p className="font-semibold">📈 How to read this graph?</p>
      <p className="mt-1 text-gray-700">
        Each dot is one checkup. Dashed lines are danger levels (20%, 50%, 75%). {msg}
      </p>
    </div>
  );
}
