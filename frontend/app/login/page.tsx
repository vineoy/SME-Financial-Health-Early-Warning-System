"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-2xl font-bold">Log in</h1>
      <input className="mt-4 w-full rounded-lg border p-2.5" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="mt-2 w-full rounded-lg border p-2.5" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <button
        className="mt-4 w-full rounded-lg bg-black py-2.5 text-white"
        onClick={async () => {
          try {
            const d = await api.login(email, password);
            localStorage.setItem("sme_token", d.access_token);
            r.push("/dashboard");
          } catch (e) { setErr((e as Error).message); }
        }}
      >Log in</button>
      <p className="mt-3 text-sm">No account? <Link href="/register" className="underline">Sign up</Link></p>
    </main>
  );
}
