import { NextResponse } from "next/server";
import {
  createProductInSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  SupabaseProductRow,
  supabaseConfig,
} from "@/lib/supabase";
import {
  getStoreProductsCatalog,
  invalidateProductCache,
  mapSupabaseProduct,
  productBodyToRow,
} from "@/lib/products";
import { DEFAULT_CATEGORY } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * GET /api/store-products        → visible products for the storefront (cost and trade prices removed)
 * GET /api/store-products?all=1  → every product including hidden ones (dashboard)
 */
export async function GET(request: Request) {
  const includeHidden = new URL(request.url).searchParams.get("all") === "1";

  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.error("GET store-products: SUPABASE_URL / SUPABASE_ANON_KEY are not configured");
    return NextResponse.json(
      { error: "Product catalog is not configured on the server." },
      { status: 503, headers: noStore }
    );
  }

  try {
    const products = await getStoreProductsCatalog();
    const body = includeHidden
      ? products
      : products.filter((p) => p.isActive).map((p) => ({ ...p, buyingPrice: 0, wholesalePrice: undefined }));
    return NextResponse.json(body, { headers: noStore });
  } catch (error) {
    console.error("GET store-products error:", error);
    const message = error instanceof Error ? error.message : "Supabase product query failed";
    return NextResponse.json({ error: `Unable to load products: ${message}` }, { status: 502, headers: noStore });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row: SupabaseProductRow = {
      name: "Untitled product",
      category: DEFAULT_CATEGORY,
      price: 0,
      buying_price: 0,
      quantity_in_stock: 0,
      is_active: true,
      image_url: null,
      ...productBodyToRow(body),
    };

    const { data, error } = await createProductInSupabase(row);
    if (error || !data) {
      return NextResponse.json({ error: error || "Failed to save product" }, { status: 400 });
    }

    invalidateProductCache();
    return NextResponse.json({ success: true, product: mapSupabaseProduct(data) });
  } catch (error) {
    console.error("POST store-products error:", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const body = await request.json();
    const { data, error } = await updateProductInSupabase(id, productBodyToRow(body));
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    invalidateProductCache();
    return NextResponse.json({ success: true, product: data ? mapSupabaseProduct(data) : null });
  } catch (error) {
    console.error("PATCH store-products error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const success = await deleteProductFromSupabase(id);
    if (success) invalidateProductCache();
    return NextResponse.json({ success });
  } catch (error) {
    console.error("DELETE store-products error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
