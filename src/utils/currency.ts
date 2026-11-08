const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a USD amount, e.g. 1234.5 → "$1,234.50" */
export function formatUSD(amount: number): string {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/** Round to whole cents to avoid floating point drift in totals. */
export function roundCents(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/** Parse "$12.50", "12.5" or 12.5 into a number of dollars. */
export function parseUSD(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? roundCents(value) : fallback;
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? roundCents(parseFloat(match[0])) : fallback;
}
