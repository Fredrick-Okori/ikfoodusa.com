import { NextResponse } from "next/server";
import { supabase, SupabaseCategoryRow } from "@/lib/supabase";
import { Category, DEFAULT_CATEGORIES } from "@/lib/catalog";
import { slugify } from "@/data/products";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function mapCategory(row: SupabaseCategoryRow): Category {
  return {
    id: row.id ? String(row.id) : undefined,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    displayOrder: Number(row.display_order ?? 0),
    isActive: row.is_active !== false,
  };
}

function bodyToRow(body: Record<string, unknown>): Partial<SupabaseCategoryRow> {
  const row: Partial<SupabaseCategoryRow> = {};
  if (body.name !== undefined) {
    row.name = String(body.name).trim();
    row.slug = slugify(row.name);
  }
  if (body.description !== undefined) row.description = String(body.description ?? "").trim();
  if (body.subcategories !== undefined) {
    const list = Array.isArray(body.subcategories)
      ? body.subcategories
      : String(body.subcategories ?? "").split(",");
    row.subcategories = list.map((s) => String(s).trim()).filter(Boolean);
  }
  if (body.displayOrder !== undefined) row.display_order = Math.floor(Number(body.displayOrder) || 0);
  if (body.isActive !== undefined) row.is_active = Boolean(body.isActive);
  return row;
}

/**
 * GET /api/categories        → active categories (storefront)
 * GET /api/categories?all=1  → all categories including hidden (dashboard)
 * Falls back to the built-in vanilla categories when the table is empty or unreachable.
 */
export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  try {
    let query = supabase
      .from("categories")
      .select("id,name,slug,description,subcategories,display_order,is_active")
      .is("parent_id", null)
      .order("display_order", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return NextResponse.json(DEFAULT_CATEGORIES, { headers: { ...noStore, "X-Categories-Source": "defaults" } });
    }
    return NextResponse.json((data as SupabaseCategoryRow[]).map(mapCategory), { headers: noStore });
  } catch (error) {
    console.warn("GET categories fallback to defaults:", error);
    return NextResponse.json(DEFAULT_CATEGORIES, { headers: { ...noStore, "X-Categories-Source": "defaults" } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row = bodyToRow(body);
    if (!row.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ is_active: true, display_order: 99, ...row }])
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, category: mapCategory(data[0]) });
  } catch (error) {
    console.error("POST categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });

    const body = await request.json();
    const row = bodyToRow(body);

    // Keep product rows in sync when a category is renamed.
    if (row.name) {
      const { data: existing } = await supabase.from("categories").select("name").eq("id", id).single();
      if (existing?.name && existing.name !== row.name) {
        await supabase.from("products").update({ category: row.name }).eq("category", existing.name);
      }
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, category: data?.[0] ? mapCategory(data[0]) : null });
  } catch (error) {
    console.error("PATCH categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });

    const { data: existing } = await supabase.from("categories").select("name").eq("id", id).single();
    if (existing?.name) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category", existing.name);
      if (count && count > 0) {
        return NextResponse.json(
          { error: `Move or delete the ${count} product(s) in "${existing.name}" first.` },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE categories error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
