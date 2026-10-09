import Link from "next/link";
import { BAND } from "@/lib/format";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold text-gray-500">SME Financial Health & Early-Warning System</p>
      <h1 className="mt-2 text-4xl font-bold">Know your bankruptcy risk before the bank does.</h1>
      <p className="mt-4 text-gray-600">
        Enter your P&amp;L and balance-sheet numbers in plain rupees. Our XGBoost model
        (trained on 6,819 companies, ROC 0.947) scores your risk and explains why — in plain words.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/register" className="rounded-lg bg-black px-5 py-2.5 text-white">Get started free</Link>
        <Link href="/login" className="rounded-lg border px-5 py-2.5">Log in</Link>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Risk bands — same everywhere in the app</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(BAND) as (keyof typeof BAND)[]).map((b) => (
          <div key={b} className="rounded-lg border p-3" style={{ background: BAND[b].bg }}>
            <p className="font-semibold" style={{ color: BAND[b].color }}>{BAND[b].label}</p>
            <p className="text-xs text-gray-600">
              {b === "green" ? "< 20%" : b === "yellow" ? "20–50%" : b === "orange" ? "50–75%" : "> 75%"}
            </p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">How it works</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-gray-700">
        <li>Add a company, then enter <b>raw money values</b> (revenue, assets, loans…) — never ratios.</li>
        <li>Or upload a <b>CSV</b> — the app tells you exactly which columns give the best result.</li>
        <li>Get a risk score, the top reasons in plain words, and warnings like liquidity crunch.</li>
        <li>Repeat every quarter — the trend line is your early warning.</li>
      </ol>
    </main>
  );
}
