"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BandBadge } from "@/components/viz";
import { timeAgo } from "@/lib/format";
import type { Band } from "@/lib/format";

type Co = { id: string; name: string; sector: string; latest: { risk_score: number; risk_band: Band; created_at: string } | null };

export default function Dashboard() {
  const r = useRouter();
  const [cos, setCos] = useState<Co[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const load = () => api.companies().then(setCos).catch((e) => setErr((e as Error).message));
  useEffect(() => { load(); }, []);
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your companies</h1>
        <button className="text-sm underline" onClick={() => { localStorage.removeItem("sme_token"); r.push("/login"); }}>Log out</button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-4 flex gap-2">
        <input className="flex-1 rounded-lg border p-2.5" placeholder="New company name" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          className="rounded-lg bg-black px-4 text-white"
          onClick={async () => {
            const c = await api.createCompany(name || "Untitled SME");
            setName(""); load(); r.push(`/assess/new?company=${c.id}`);
          }}
        >Add + Assess</button>
      </div>
      <div className="mt-6 grid gap-3">
        {cos.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-gray-500">{c.latest ? `updated ${timeAgo(c.latest.created_at)}` : "no assessments yet"}</p>
            </div>
            <div className="flex items-center gap-3">
              {c.latest
                ? <BandBadge band={c.latest.risk_band} score={c.latest.risk_score} />
                : <span className="text-xs text-gray-400">not scored</span>}
              <Link href={c.latest ? `/companies/${c.id}` : `/assess/new?company=${c.id}`} className="rounded-lg border px-3 py-1.5 text-sm">
                {c.latest ? "Open" : "Assess"}
              </Link>
            </div>
          </div>
        ))}
        {cos.length === 0 && <p className="text-sm text-gray-500">No companies yet. Add your first above.</p>}
      </div>
    </main>
  );
}
