export const fmtPct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export const fmtPts = (n: number, digits = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n * 100).toFixed(digits)} pts`;

export function fmtMoney(n: number, opts: { signed?: boolean } = {}) {
  const sign = n < 0 ? "−" : opts.signed && n > 0 ? "+" : "";
  const a = Math.abs(n);
  const body =
    a >= 1_000_000 ? `$${(a / 1_000_000).toFixed(1)}M` : a >= 1_000 ? `$${Math.round(a / 1_000)}K` : `$${Math.round(a)}`;
  return sign + body;
}

export const fmtInt = (n: number) => n.toLocaleString("en-US");

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const fmtDateShort = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

/** Relative change, e.g. 0.12 = +12%. */
export const fmtChange = (curr: number, prev: number) => {
  if (!prev) return "n/a";
  const c = (curr - prev) / Math.abs(prev);
  return `${c > 0 ? "+" : c < 0 ? "−" : ""}${Math.abs(c * 100).toFixed(0)}%`;
};
