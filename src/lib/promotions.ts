import { BRAND } from "@/lib/brand";
import { roundCents } from "@/utils/currency";

/** Promo codes accepted at checkout (code → fractional discount on subtotal). */
export const PROMO_CODES: Record<string, { rate: number; label: string }> = {
  WELCOME10: { rate: 0.1, label: "10% welcome discount" },
  BAKER15: { rate: 0.15, label: "15% baker's discount" },
};

export function lookupPromo(code: string | undefined | null) {
  const clean = String(code || "").trim().toUpperCase();
  const promo = PROMO_CODES[clean];
  return promo ? { code: clean, ...promo } : null;
}

export function shippingFor(subtotalUSD: number): number {
  if (subtotalUSD <= 0) return 0;
  return subtotalUSD >= BRAND.freeShippingThreshold ? 0 : BRAND.standardShippingFee;
}

export function computeTotals(subtotalUSD: number, promoCode?: string | null) {
  const subtotal = roundCents(subtotalUSD);
  const promo = lookupPromo(promoCode);
  const discount = promo ? roundCents(subtotal * promo.rate) : 0;
  const shipping = shippingFor(subtotal - discount);
  const total = roundCents(Math.max(0, subtotal - discount + shipping));
  return { subtotal, discount, shipping, total, promo };
}
