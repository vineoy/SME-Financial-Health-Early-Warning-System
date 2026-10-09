export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sme_token");
}

async function req(path: string, opts: RequestInit = {}, auth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (!t) throw new Error("Please log in first.");
    headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  signup: (email: string, password: string) =>
    req("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  login: (email: string, password: string) =>
    req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  companies: () => req("/api/companies"),
  createCompany: (name: string, sector = "general") =>
    req("/api/companies", { method: "POST", body: JSON.stringify({ name, sector }) }),
  predict: (companyId: string, raw: Record<string, number>) =>
    req(`/api/companies/${companyId}/predict`, { method: "POST", body: JSON.stringify(raw) }),
  history: (companyId: string) => req(`/api/companies/${companyId}/assessments`),
};
