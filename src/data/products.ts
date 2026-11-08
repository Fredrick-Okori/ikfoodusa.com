import type { PriceTier } from "@/lib/pricing";

export interface VanillaProfile {
  aroma: string;
  flavor: string;
  uses: string;
  storage: string;
}

export interface Product {
  id: string;
  name: string;
  /** Brand, farm or cooperative that produced the vanilla */
  producer: string;
  origin: string;
  category: string;
  subcategory?: string;
  /** e.g. "Planifolia", "Tahitensis" */
  species?: string;
  /** e.g. "Grade A / Gourmet" */
  grade?: string;
  /** Pack size as sold, e.g. "10 beans", "4 fl oz", "100 g" */
  size: string;
  beanLength?: string;
  moisture?: string;
  harvest?: string;
  /** Selling price in USD */
  numericPrice: number;
  /** Optional "was" price in USD, shown struck through */
  compareAtPrice?: number;
  /** Cost price in USD (dashboard only) */
  buyingPrice: number;
  badge?: string;
  sku?: string;
  description: string;
  profile: VanillaProfile;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  /** Hidden from the storefront when false */
  isActive: boolean;
  /** Volume pricing for everyone, ascending by minQty */
  priceTiers: PriceTier[];
  /** Trade price for approved trade accounts (omitted from the public API) */
  wholesalePrice?: number;
  /** Minimum units before the trade price applies */
  wholesaleMinQty: number;
}

/** Shown for products without their own photo. Swap this path when real product photos are ready. */
export const PRODUCT_PLACEHOLDER_IMAGE = "/product_hero.avif";

/** Older placeholder paths that should resolve to the current placeholder. */
const LEGACY_PLACEHOLDERS = new Set([
  "/vanilla-placeholder.svg",
  "/no31-bm-web-gry_c7d4a801-624d-4138-8905-8fae33e7bafe.webp",
]);

export function resolveProductImage(src?: string | null): string {
  return !src || LEGACY_PLACEHOLDERS.has(src) ? PRODUCT_PLACEHOLDER_IMAGE : src;
}

export const EMPTY_PROFILE: VanillaProfile = { aroma: "", flavor: "", uses: "", storage: "" };

// Live catalog is loaded from Supabase; this list is only a last-resort fallback.
export const products: Product[] = [];

/** Convert a product name or text into a URL-safe slug, e.g. "Grade A Planifolia Beans" → "grade-a-planifolia-beans" */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Build the canonical product detail URL using the product name slug */
export function productHref(product: Product): string {
  if (!product) return "/shop";
  const nameSlug = slugify(product.name || "");
  const slug = nameSlug || slugify(product.producer || "") || String(product.id || "");
  return `/product/${slug}`;
}

/** Storefront category link */
export function categoryHref(category: string): string {
  return `/shop?category=${encodeURIComponent(category)}`;
}

/**
 * Slug lookup against live database products:
 * 1. Exact match (name slug, producer+name slug, name+origin slug, raw name, or ID).
 * 2. Prefix & containment matches across slug combinations.
 * 3. Token-set matching (all words in the slug must exist in product attributes).
 */
export function getProductBySlug(rawSlug: string, list: Product[]): Product | undefined {
  if (!rawSlug || !Array.isArray(list) || list.length === 0) return undefined;

  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug).trim().toLowerCase();
  } catch {
    decoded = rawSlug.trim().toLowerCase();
  }

  const normalizedSlug = slugify(decoded);
  if (!normalizedSlug) return undefined;

  for (const p of list) {
    if (!p) continue;
    const pId = String(p.id || "").trim().toLowerCase();
    const candidates = [
      slugify(p.name || ""),
      slugify(`${p.producer || ""} ${p.name || ""}`),
      slugify(`${p.name || ""} ${p.origin || ""}`),
      slugify(`${p.producer || ""} ${p.name || ""} ${p.origin || ""}`),
    ];
    if (
      candidates.includes(normalizedSlug) ||
      pId === decoded ||
      (p.name || "").trim().toLowerCase() === decoded
    ) {
      return p;
    }
  }

  for (const p of list) {
    if (!p) continue;
    const candidates = [
      slugify(p.name || ""),
      slugify(`${p.producer || ""} ${p.name || ""}`),
      slugify(`${p.name || ""} ${p.origin || ""}`),
    ].filter(Boolean);

    for (const c of candidates) {
      if (
        (c.length >= 3 && normalizedSlug.includes(c)) ||
        (normalizedSlug.length >= 3 && c.includes(normalizedSlug))
      ) {
        return p;
      }
    }
  }

  const slugTokens = normalizedSlug.split("-").filter(Boolean);
  for (const p of list) {
    if (!p) continue;
    const combinedText = slugify(`${p.producer || ""} ${p.name || ""} ${p.category || ""} ${p.origin || ""}`);
    const productTokens = new Set(combinedText.split("-").filter(Boolean));
    if (slugTokens.every((token) => productTokens.has(token) || combinedText.includes(token))) {
      return p;
    }
  }

  return undefined;
}
