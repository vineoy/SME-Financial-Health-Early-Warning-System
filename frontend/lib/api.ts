export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sme_token");
}

function readableDetail(body: unknown): string {
  const d = (body as { detail?: unknown }).detail;
  if (Array.isArray(d)) {
    // FastAPI 422: [{loc: [...], msg: "...", ...}] -> human lines
    return d
      .map((e) => {
        const loc = Array.isArray((e as { loc?: unknown }).loc)
          ? ((e as { loc: unknown[] }).loc.filter((x) => x !== "body").join(".") + ": ")
          : "";
        return `${loc}${(e as { msg?: string }).msg || "invalid"}`;
      })
      .join("; ");
  }
  if (typeof d === "string") return d;
  return "";
}

async function req(path: string, opts: RequestInit = {}, auth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (!t) throw new Error("Please log in first.");
    headers["Authorization"] = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  } catch {
    throw new Error(`Cannot reach API at ${API_URL}. Is the backend running? (cd backend, then: uv run uvicorn app.main:app)`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(readableDetail(body) || `Request failed (${res.status})`);
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
  predict: (companyId: string, raw: Record<string, number | null>) =>
    req(`/api/companies/${companyId}/predict`, { method: "POST", body: JSON.stringify(raw) }),
  history: (companyId: string) => req(`/api/companies/${companyId}/assessments`),
};
