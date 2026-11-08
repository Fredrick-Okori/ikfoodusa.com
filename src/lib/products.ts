import { supabase, getProductsFromSupabase, SupabaseProductRow, PRODUCT_COLUMNS } from "@/lib/supabase";
import {
  Product,
  products as fallbackCatalog,
  getProductBySlug,
  resolveProductImage,
} from "@/data/products";
import { DEFAULT_CATEGORY } from "@/lib/catalog";
import { parseUSD } from "@/utils/currency";
import { normalizeTiers } from "@/lib/pricing";

const PRODUCT_CACHE_TTL_MS = 60_000;
let productCache: { products: Product[]; expiresAt: number } | null = null;
let productRequest: Promise<Product[]> | null = null;
let lastKnownGoodProducts: Product[] = [];

export function invalidateProductCache() {
  productCache = null;
  productRequest = null;
}

export function mapSupabaseProduct(sp: SupabaseProductRow): Product {
  const stock = Number(sp.quantity_in_stock ?? 0);
  const compareAt = sp.compare_at_price != null ? parseUSD(sp.compare_at_price) : 0;

  return {
    id: String(sp.id),
    name: sp.name || "Untitled product",
    producer: sp.brand || "IK Foods USA",
    origin: sp.country_of_origin || "",
    category: sp.category || DEFAULT_CATEGORY,
    subcategory: sp.subcategory || undefined,
    species: sp.species || undefined,
    grade: sp.grade || undefined,
    size: sp.size_label || "",
    beanLength: sp.bean_length || undefined,
    moisture: sp.moisture || undefined,
    harvest: sp.harvest || undefined,
    numericPrice: parseUSD(sp.price),
    compareAtPrice: compareAt > 0 ? compareAt : undefined,
    buyingPrice: parseUSD(sp.buying_price),
    badge: sp.badge || undefined,
    sku: sp.sku || undefined,
    description: sp.description || "",
    profile: {
      aroma: sp.profile?.aroma || "",
      flavor: sp.profile?.flavor || "",
      uses: sp.profile?.uses || "",
      storage: sp.profile?.storage || "",
    },
    image: resolveProductImage(sp.image_url),
    inStock: stock > 0 && sp.is_active !== false,
    stockQuantity: stock,
    isActive: sp.is_active !== false,
    priceTiers: normalizeTiers(sp.price_tiers),
    wholesalePrice: sp.wholesale_price != null && Number(sp.wholesale_price) > 0 ? parseUSD(sp.wholesale_price) : undefined,
    wholesaleMinQty: Math.max(1, Number(sp.wholesale_min_qty) || 1),
  };
}

/** Convert an API request body (from the dashboard forms) into a database row. */
export function productBodyToRow(body: Record<string, unknown>): Partial<SupabaseProductRow> {
  const row: Partial<SupabaseProductRow> = {};
  const text = (key: string) => {
    const value = body[key];
    if (value === undefined) return undefined;
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  if (body.name !== undefined) row.name = String(body.name).trim() || "Untitled product";
  if (body.producer !== undefined) row.brand = text("producer");
  if (body.origin !== undefined) row.country_of_origin = text("origin");
  if (body.category !== undefined) row.category = text("category") || DEFAULT_CATEGORY;
  if (body.subcategory !== undefined) row.subcategory = text("subcategory");
  if (body.species !== undefined) row.species = text("species");
  if (body.grade !== undefined) row.grade = text("grade");
  if (body.size !== undefined) row.size_label = text("size");
  if (body.beanLength !== undefined) row.bean_length = text("beanLength");
  if (body.moisture !== undefined) row.moisture = text("moisture");
  if (body.harvest !== undefined) row.harvest = text("harvest");
  if (body.badge !== undefined) row.badge = text("badge");
  if (body.sku !== undefined) row.sku = text("sku");
  if (body.description !== undefined) row.description = String(body.description ?? "");
  // Store null when no photo is set, so the placeholder can change without touching the database.
  if (body.image !== undefined) row.image_url = String(body.image || "") || null;
  if (body.numericPrice !== undefined) row.price = parseUSD(body.numericPrice);
  if (body.compareAtPrice !== undefined) {
    const compareAt = parseUSD(body.compareAtPrice);
    row.compare_at_price = compareAt > 0 ? compareAt : null;
  }
  if (body.buyingPrice !== undefined) row.buying_price = parseUSD(body.buyingPrice);
  if (body.stockQuantity !== undefined) {
    const stock = Math.max(0, Math.floor(Number(body.stockQuantity) || 0));
    row.quantity_in_stock = stock;
  }
  if (body.isActive !== undefined) row.is_active = Boolean(body.isActive);
  if (body.priceTiers !== undefined) row.price_tiers = normalizeTiers(body.priceTiers);
  if (body.wholesalePrice !== undefined) {
    const trade = parseUSD(body.wholesalePrice);
    row.wholesale_price = trade > 0 ? trade : null;
  }
  if (body.wholesaleMinQty !== undefined) row.wholesale_min_qty = Math.max(1, Math.floor(Number(body.wholesaleMinQty) || 1));
  if (body.profile && typeof body.profile === "object") {
    const p = body.profile as Record<string, unknown>;
    row.profile = {
      aroma: String(p.aroma ?? ""),
      flavor: String(p.flavor ?? ""),
      uses: String(p.uses ?? ""),
      storage: String(p.storage ?? ""),
    };
  }
  return row;
}

/**
 * Cached product catalog getter.
 * Deduplicates in-flight requests and falls back to the last good catalog on transient failures.
 */
export async function getStoreProductsCatalog(): Promise<Product[]> {
  const cached = productCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.products;
  }

  if (productRequest) return productRequest;

  productRequest = (async () => {
    try {
      const rows = await getProductsFromSupabase();
      const mapped = (rows || []).map(mapSupabaseProduct);
      lastKnownGoodProducts = mapped;
      return mapped.length > 0 ? mapped : fallbackCatalog;
    } catch (err) {
      console.warn("Failed to get product catalog from Supabase:", err);
      if (lastKnownGoodProducts.length > 0) return lastKnownGoodProducts;
      throw err;
    }
  })();

  try {
    const products = await productRequest;
    productCache = { products, expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS };
    return products;
  } finally {
    productRequest = null;
  }
}

/**
 * Product lookup by slug: cached catalog first, then a targeted Supabase search.
 */
export async function findProductBySlug(slug: string): Promise<Product | undefined> {
  const catalog = await getStoreProductsCatalog();
  const found = getProductBySlug(slug, catalog);
  if (found) return found;

  try {
    const rawSlug = decodeURIComponent(slug || "").trim().toLowerCase();
    const firstToken = rawSlug.replace(/[^a-z0-9]/g, " ").split(/\s+/).find((t) => t.length > 1);
    if (!firstToken) return undefined;

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .or(`name.ilike.%${firstToken}%,brand.ilike.%${firstToken}%`);

    if (!error && data && data.length > 0) {
      const candidates = (data as SupabaseProductRow[]).map(mapSupabaseProduct);
      return getProductBySlug(slug, candidates) || candidates[0];
    }
  } catch (err) {
    console.warn("Targeted Supabase slug lookup exception:", err);
  }

  return undefined;
}
