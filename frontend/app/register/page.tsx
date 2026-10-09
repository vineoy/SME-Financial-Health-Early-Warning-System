"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Register() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-2xl font-bold">Create free account</h1>
      <input className="mt-4 w-full rounded-lg border p-2.5" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="mt-2 w-full rounded-lg border p-2.5" placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <button
        className="mt-4 w-full rounded-lg bg-black py-2.5 text-white"
        onClick={async () => {
          try {
            const d = await api.signup(email, password);
            localStorage.setItem("sme_token", d.access_token);
            r.push("/dashboard");
          } catch (e) { setErr((e as Error).message); }
        }}
      >Sign up</button>
      <p className="mt-3 text-sm">Have an account? <Link href="/login" className="underline">Log in</Link></p>
    </main>
  );
}
