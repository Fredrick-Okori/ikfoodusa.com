import { createClient } from "@supabase/supabase-js";

export const supabaseConfig = {
  // Prefer server-only variables in deployed environments. The public names
  // remain a local-development fallback for existing .env.local files.
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  // Accepts the newer "publishable" key name as well as the legacy anon key name.
  anonKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "",
};

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  if (process.env.NODE_ENV === "production") {
    console.warn("Supabase URL or anon key is not configured.");
  }
}

export const supabase = createClient(
  supabaseConfig.url || "https://placeholder.supabase.co",
  supabaseConfig.anonKey || "placeholder-anon-key"
);

export interface SupabaseOrderItem {
  productName: string;
  quantity: number;
  unitPriceUSD: number;
  subtotalUSD: number;
  unitBuyingPriceUSD?: number;
  grossProfitUSD?: number;
  developerProfitShareUSD?: number;
  priceSource?: "retail" | "volume" | "trade";
}

export interface SupabaseOrder {
  id?: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  order_status: string;
  payment_method: string;
  payment_status: string;
  subtotal_usd: number;
  shipping_usd: number;
  discount_usd: number;
  total_amount_usd: number;
  commission_rate: number;
  gross_profit_usd: number;
  developer_profit_share_usd: number;
  store_profit_usd: number;
  notes?: string | null;
  customer_type?: "B2C" | "B2B";
  company_name?: string | null;
  po_number?: string | null;
  trade_account_id?: string | null;
  items: SupabaseOrderItem[];
  created_at?: string;
}

export interface SupabaseProductRow {
  id?: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  country_of_origin?: string | null;
  species?: string | null;
  grade?: string | null;
  size_label?: string | null;
  bean_length?: string | null;
  moisture?: string | null;
  harvest?: string | null;
  price: number; // USD
  compare_at_price?: number | null; // USD
  buying_price?: number | null; // USD
  quantity_in_stock?: number;
  description?: string | null;
  badge?: string | null;
  sku?: string | null;
  profile?: { aroma?: string; flavor?: string; uses?: string; storage?: string } | null;
  is_active?: boolean;
  image_url: string | null;
  price_tiers?: { minQty: number; price: number }[] | null;
  wholesale_price?: number | null;
  wholesale_min_qty?: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Columns from the base schema. */
export const BASE_PRODUCT_COLUMNS =
  "id,name,brand,category,subcategory,country_of_origin,species,grade,size_label,bean_length,moisture,harvest,price,compare_at_price,buying_price,quantity_in_stock,description,badge,sku,profile,is_active,image_url,created_at";

/** Base columns plus B2B pricing (supabase/migrations/002_b2b.sql). */
export const PRODUCT_COLUMNS = `${BASE_PRODUCT_COLUMNS},price_tiers,wholesale_price,wholesale_min_qty`;

export interface SupabaseCategoryRow {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  subcategories?: string[] | null;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Sign in manager with Supabase Auth
 */
export async function signInManagerWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.warn("Supabase auth exception:", err);
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err.message : "Unable to authenticate. Please try again.",
    };
  }
}

/**
 * Sign out manager from Supabase
 */
export async function signOutManagerFromSupabase() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase signout exception:", err);
  }
}

/**
 * Save an incoming customer order with its gross-profit settlement snapshot.
 */
export async function saveOrderToSupabase(orderData: SupabaseOrder) {
  try {
    let { data, error } = await supabase.from("orders").insert([orderData]).select();

    // Before supabase/migrations/002_b2b.sql runs, retail orders can still be saved without B2B columns.
    if (error && /customer_type|company_name|po_number|trade_account_id/.test(error.message) && !orderData.trade_account_id) {
      console.warn("Order B2B columns missing — run supabase/migrations/002_b2b.sql");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { customer_type, company_name, po_number, trade_account_id, ...base } = orderData;
      ({ data, error } = await supabase.from("orders").insert([base]).select());
    }
    if (error) {
      console.error("Supabase insert order error:", error.message);
      return { data: null, error: error.message };
    }
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    console.error("Supabase order save exception:", err);
    return { data: null, error: err instanceof Error ? err.message : "Failed to save order" };
  }
}

/**
 * Fetch all products from Supabase products table
 */
export async function getProductsFromSupabase(): Promise<SupabaseProductRow[] | null> {
  const query = (columns: string) =>
    supabase.from("products").select(columns).order("created_at", { ascending: false });

  let { data, error } = await query(PRODUCT_COLUMNS);

  // Keep the storefront working if the B2B migration hasn't been applied yet.
  if (error && /column .* does not exist/i.test(error.message)) {
    console.warn("B2B product columns missing — run supabase/migrations/002_b2b.sql");
    ({ data, error } = await query(BASE_PRODUCT_COLUMNS));
  }

  if (error || !data) {
    const message = error?.message || "Supabase returned no product data";
    console.error("Supabase products fetch exception:", message);
    throw new Error(message);
  }
  return data as unknown as SupabaseProductRow[];
}

export async function createProductInSupabase(productData: SupabaseProductRow) {
  try {
    const { data, error } = await supabase.from("products").insert([productData]).select();
    if (error) {
      console.error("Supabase create product error:", error.message, error.details);
      return { data: null, error: error.message };
    }
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    console.error("Supabase product creation exception:", err);
    return { data: null, error: err instanceof Error ? err.message : "Failed to create product" };
  }
}

export async function updateProductInSupabase(id: string, productData: Partial<SupabaseProductRow>) {
  const { data, error } = await supabase
    .from("products")
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();
  if (error) {
    console.warn("Supabase update product notice:", error.message);
    return { data: null, error: error.message };
  }
  return { data: data?.[0] || null, error: null };
}

export async function deleteProductFromSupabase(id: string) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.warn("Supabase delete product notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase product delete exception:", err);
    return false;
  }
}
