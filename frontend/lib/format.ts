export const BAND = {
  green: { label: "Healthy", color: "#16a34a", bg: "#dcfce7" },
  yellow: { label: "Watch", color: "#a16207", bg: "#fef9c3" },
  orange: { label: "At-Risk", color: "#c2410c", bg: "#ffedd5" },
  red: { label: "Critical", color: "#dc2626", bg: "#fee2e2" },
} as const;

export type Band = keyof typeof BAND;

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
export const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
