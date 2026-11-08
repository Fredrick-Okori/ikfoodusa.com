import { roundCents } from "@/utils/currency";

export interface PriceTier {
  minQty: number;
  price: number;
}

export interface PricedProduct {
  numericPrice: number;
  priceTiers?: PriceTier[];
  wholesalePrice?: number;
  wholesaleMinQty?: number;
}

export type PriceSource = "retail" | "volume" | "trade";

/** Clean, sort and de-duplicate volume tiers (ascending by minimum quantity). */
export function normalizeTiers(raw: unknown): PriceTier[] {
  if (!Array.isArray(raw)) return [];
  const byQty = new Map<number, number>();
  for (const t of raw) {
    const minQty = Math.floor(Number((t as PriceTier)?.minQty));
    const price = roundCents(Number((t as PriceTier)?.price));
    if (minQty >= 2 && price > 0) byQty.set(minQty, price);
  }
  return [...byQty.entries()].map(([minQty, price]) => ({ minQty, price })).sort((a, b) => a.minQty - b.minQty);
}

/**
 * Unit price for a quantity. Rules (lowest applicable price wins):
 *  - retail price for everyone
 *  - volume tier price once the quantity reaches a tier
 *  - trade price for an approved trade account once wholesaleMinQty is met
 */
export function unitPriceFor(
  product: PricedProduct,
  quantity: number,
  isTradeAccount = false
): { price: number; source: PriceSource } {
  let best = { price: product.numericPrice, source: "retail" as PriceSource };

  for (const tier of product.priceTiers || []) {
    if (quantity >= tier.minQty && tier.price < best.price) best = { price: tier.price, source: "volume" };
  }

  if (
    isTradeAccount &&
    product.wholesalePrice &&
    product.wholesalePrice > 0 &&
    quantity >= (product.wholesaleMinQty || 1) &&
    product.wholesalePrice < best.price
  ) {
    best = { price: product.wholesalePrice, source: "trade" };
  }

  return { price: roundCents(best.price), source: best.source };
}

/** Lowest price a shopper can reach through volume tiers ("from $X in bulk"). */
export function lowestVolumePrice(product: PricedProduct): number | null {
  const tiers = product.priceTiers || [];
  return tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
}
