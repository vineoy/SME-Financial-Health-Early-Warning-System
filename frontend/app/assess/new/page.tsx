"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { FIELDS, REQUIRED_KEYS, cleanNumber, labelOf } from "@/lib/fields";
import { Gauge, BandBadge, FactorBars } from "@/components/viz";
import { SignalExplainer } from "@/components/explain";
import type { Band } from "@/lib/format";

const STEPS = ["Revenue & Profit", "Assets & Cash", "Liabilities & Debt"];

type Result = {
  risk_score: number; risk_band: Band; health_score: number;
  top_factors: { feature: string; plain: string; value: number; pushes_risk_up: boolean }[];
  warnings: string[];
};

function AssessInner() {
  const params = useSearchParams();
  const r = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [cid, setCid] = useState(params.get("company") || "");
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvErr, setCsvErr] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.companies().then((c) => {
      setCompanies(c);
      if (!cid && c.length > 0) setCid(c[0].id);
    }).catch((e) => setErr((e as Error).message));
  }, []);

  const filled = useMemo(() => {
    const keys = mode === "manual" ? Object.keys(vals).filter((k) => vals[k] !== "" && vals[k] !== undefined) : [];
    return keys.length;
  }, [vals, mode]);
  const coverage = Math.round((filled / FIELDS.length) * 100);

  // Returns payload + list of human-readable problems (empty = valid).
  const toPayload = (row: Record<string, string | number>) => {
    const p: Record<string, number | null> = {};
    const problems: string[] = [];
    for (const f of FIELDS) {
      const raw = row[f.key];
      if (raw === "" || raw === undefined || raw === null) {
        // interest_bearing_debt left blank -> backend's safer default (total liabilities)
        p[f.key] = f.key === "interest_bearing_debt" ? null : 0;
        continue;
      }
      const n = cleanNumber(raw);
      if (n === null || Number.isNaN(n)) {
        problems.push(`${f.label}: "${raw}" is not a number (remove commas/letters)`);
        p[f.key] = 0;
      } else {
        p[f.key] = n;
      }
    }
    return { payload: p, problems };
  };

  const checkRequired = (p: Record<string, number | null>) => {
    const missing: string[] = [];
    for (const k of REQUIRED_KEYS) {
      const v = p[k];
      if (v === null || v === undefined || v <= 0) missing.push(`${labelOf(k)} must be > 0`);
    }
    return missing;
  };

  const submitManual = async () => {
    setErr(""); setRes(null);
    const { payload, problems } = toPayload(vals);
    const missing = checkRequired(payload);
    if (problems.length > 0 || missing.length > 0) {
      setErr([...missing, ...problems].join("; "));
      return;
    }
    if (!cid) { setErr("Select a company first."); return; }
    setBusy(true);
    try { setRes(await api.predict(cid, payload)); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const onCsv = async (file: File) => {
    setCsvErr([]); setCsvRows([]); setErr("");
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim());
    const errs: string[] = [];
    const known = new Set(FIELDS.map((f) => f.key));
    for (const h of headers) if (!known.has(h)) errs.push(`Unknown column ignored: ${h}`);
    for (const k of REQUIRED_KEYS) if (!headers.includes(k)) errs.push(`Missing REQUIRED column: ${k} — predictions will be rejected without it.`);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue;
      const cells = lines[i].split(",");
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { if (known.has(h)) row[h] = (cells[j] || "").trim(); });
      const bad: string[] = [];
      for (const k of REQUIRED_KEYS) {
        const n = cleanNumber(row[k]);
        if (n === null || Number.isNaN(n) || n <= 0) bad.push(labelOf(k));
      }
      const notNum = FIELDS.filter((f) => {
        const v = row[f.key];
        return v !== undefined && v !== "" && Number.isNaN(cleanNumber(v));
      }).map((f) => f.label);
      if (bad.length > 0) errs.push(`Row ${i}: missing/invalid required: ${bad.join(", ")}`);
      else if (notNum.length > 0) errs.push(`Row ${i}: not numbers: ${notNum.join(", ")}`);
      else rows.push(row);
    }
    setCsvErr(errs); setCsvRows(rows);
  };

  const submitCsv = async () => {
    if (!cid) { setErr("Select a company first."); return; }
    if (csvRows.length === 0) { setErr("No valid rows to submit."); return; }
    setBusy(true); setRes(null); setErr("");
    try {
      let last: Result | null = null;
      for (const row of csvRows) last = await api.predict(cid, toPayload(row).payload);
      setRes(last);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
      <h1 className="mt-2 text-2xl font-bold">New assessment</h1>

      <label className="mt-4 block text-sm font-medium">Company</label>
      <select className="mt-1 w-full rounded-lg border p-2.5" value={cid} onChange={(e) => setCid(e.target.value)}>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div className="mt-4 flex gap-2">
        {(["manual", "csv"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm ${mode === m ? "bg-black text-white" : "border"}`}>
            {m === "manual" ? "Type values" : "Upload CSV"}
          </button>
        ))}
        <a href="/sample.csv" download className="ml-auto rounded-lg border px-4 py-2 text-sm">↓ sample.csv</a>
      </div>

      {mode === "manual" ? (
        <div className="mt-4">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => setStep(i)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium ${step === i ? "bg-black text-white" : "border"}`}>{i + 1}. {s}</button>
            ))}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded bg-gray-200">
            <div className="h-full bg-black" style={{ width: `${coverage}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Coverage {coverage}% — fill as many as you can; required fields are marked *.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FIELDS.filter((f) => f.step === step + 1).map((f) => (
              <label key={f.key} className="block rounded-lg border p-3">
                <span className="text-sm font-medium">{f.label} {f.required && <span className="text-red-600">*</span>}</span>
                <input
                  className="mt-1 w-full rounded border p-2" inputMode="decimal" placeholder="Rs"
                  value={vals[f.key] || ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                />
                <span className="mt-1 block text-xs text-gray-500">{f.help}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Back</button>
            {step < 2
              ? <button onClick={() => setStep(step + 1)} className="rounded-lg bg-black px-4 py-2 text-sm text-white">Next</button>
              : <button onClick={submitManual} disabled={busy} className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Scoring…" : "Get risk score"}</button>}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border p-4">
          <input type="file" accept=".csv" onChange={(e) => e.target.files && onCsv(e.target.files[0])} />
          {csvErr.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
              {csvErr.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
          {csvRows.length > 0 && (
            <div className="mt-3">
              <p className="text-sm">{csvRows.length} valid row(s) — each becomes one assessment (e.g. one per quarter).</p>
              <button onClick={submitCsv} disabled={busy} className="mt-2 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Scoring…" : `Score ${csvRows.length} row(s)`}</button>
            </div>
          )}
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      {res && (
        <div className="mt-6 rounded-xl border p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Gauge score={res.risk_score} />
            <div>
              <BandBadge band={res.risk_band} score={res.risk_score} />
              <p className="mt-2 text-sm text-gray-600">Health score: <b>{res.health_score}</b> / 100</p>
              <Link href={`/companies/${cid}`} className="mt-2 inline-block rounded-lg bg-black px-4 py-2 text-sm text-white">Open full report →</Link>
            </div>
          </div>
          {res.warnings.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {res.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}
          <div className="mt-4"><SignalExplainer score={res.risk_score} band={res.risk_band} /></div>
          <h3 className="mt-4 font-semibold">Why this score (top factors)</h3>
          <div className="mt-2"><FactorBars factors={res.top_factors} /></div>
          <button onClick={() => r.push(`/companies/${cid}`)} className="mt-3 text-sm underline">View trend →</button>
        </div>
      )}

      <section className="mt-10 rounded-xl border p-5">
        <h2 className="text-lg font-bold">📋 CSV format guide — fields for the best outcome</h2>
        <p className="mt-1 text-sm text-gray-600">
          One row = one period (e.g. one quarter). <b>All values in Rs (plain numbers, no commas).</b> Column names must match exactly —{" "}
          <a href="/sample.csv" download className="underline">download sample.csv</a> as a template.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-xs text-gray-500"><th className="py-2">Column</th><th>What to put</th><th>Must?</th><th>Why it matters</th></tr></thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.key} className="border-b">
                  <td className="py-2 font-mono text-xs">{f.key}</td>
                  <td className="py-2 text-gray-600">{f.help}</td>
                  <td className="py-2">{f.required ? <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Required</span> : <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">Optional</span>}</td>
                  <td className="py-2 text-xs text-gray-500">{["cash", "interest_bearing_debt", "operating_cash_flow", "interest_expense", "equity", "retained_earnings"].includes(f.key) ? "⭐ High impact" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li><b>6 required columns</b> (revenue, total_income, total_expenses, total_assets, equity, paid_in_capital) — rows missing them are rejected, not guessed.</li>
          <li><b>⭐ High-impact optionals</b> — cash, interest-bearing debt, operating cash flow, interest expense: fill these for the most accurate score.</li>
          <li><b>Leave 0 / blank</b> only for inventory (services), contingent liabilities (none), interest expense (debt-free).</li>
          <li>Best outcome = all 24 columns filled → coverage 100%. Minimum useful ≈ 18+ columns.</li>
        </ul>
      </section>
    </main>
  );
}

export default function AssessNew() {
  return <Suspense><AssessInner /></Suspense>;
}
