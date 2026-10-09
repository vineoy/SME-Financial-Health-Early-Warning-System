"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Gauge, BandBadge, FactorBars } from "@/components/viz";
import { TrendChart } from "@/components/trend";
import type { Band } from "@/lib/format";

type A = {
  id: string; risk_score: number; risk_band: Band; created_at: string;
  top_factors: { feature: string; plain: string; value: number; pushes_risk_up: boolean }[];
};

export default function CompanyDetail() {
  return (
    <Suspense>
      <DetailInner />
    </Suspense>
  );
}

function DetailInner() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<A[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.history(id).then(setRows).catch((e) => setErr((e as Error).message));
  }, [id]);
  const last = rows[rows.length - 1];
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
        <Link href={`/assess/new?company=${id}`} className="rounded-lg bg-black px-4 py-2 text-sm text-white">+ New assessment</Link>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {!last && <p className="mt-6 text-sm text-gray-500">No assessments yet.</p>}
      {last && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border p-5">
            <Gauge score={last.risk_score} size={200} />
            <div>
              <BandBadge band={last.risk_band} score={last.risk_score} />
              <p className="mt-2 text-sm text-gray-600">
                Assessed {new Date(last.created_at).toLocaleString()} · {rows.length} assessment(s) total
              </p>
            </div>
          </div>
          <h2 className="mt-6 font-semibold">Risk trend — your early warning</h2>
          <div className="mt-2 rounded-xl border p-4"><TrendChart data={rows} /></div>
          <h2 className="mt-6 font-semibold">Why this score</h2>
          <div className="mt-2"><FactorBars factors={last.top_factors} /></div>
          <h2 className="mt-6 font-semibold">History</h2>
          <div className="mt-2 space-y-2">
            {[...rows].reverse().map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{new Date(a.created_at).toLocaleString()}</span>
                <BandBadge band={a.risk_band} score={a.risk_score} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
