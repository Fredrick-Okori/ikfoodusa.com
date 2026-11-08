import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  TRADE_ACCOUNT_STATUSES,
  cleanText,
  generateAccountCode,
  isEmail,
  mapTradeAccount,
} from "@/lib/b2b";

export const dynamic = "force-dynamic";

/** GET — list all trade accounts (dashboard). */
export async function GET() {
  const { data, error } = await supabase
    .from("trade_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message, docs: [] }, { status: 500 });
  return NextResponse.json({ docs: (data || []).map(mapTradeAccount) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST — public trade account application from /wholesale. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row = {
      company_name: cleanText(body.companyName, 255),
      contact_name: cleanText(body.contactName, 255),
      email: cleanText(body.email, 255).toLowerCase(),
      phone: cleanText(body.phone, 100),
      business_type: cleanText(body.businessType, 100),
      tax_id: cleanText(body.taxId, 100),
      website: cleanText(body.website, 255),
      address: cleanText(body.address, 1000),
      expected_volume: cleanText(body.expectedVolume, 255),
      message: cleanText(body.message, 2000),
      status: "Pending",
    };
    if (!row.company_name || !row.contact_name || !isEmail(row.email)) {
      return NextResponse.json({ error: "Company name, contact name and a valid email are required." }, { status: 400 });
    }

    const { error } = await supabase.from("trade_accounts").insert([row]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST trade-accounts error:", error);
    return NextResponse.json({ error: "Could not submit application" }, { status: 500 });
  }
}

/** PATCH ?id= — staff updates (status, net terms, notes). Approving issues an account code. */
export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Account id is required" }, { status: 400 });
    const body = await request.json();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) {
      if (!TRADE_ACCOUNT_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
    }
    if (body.netTerms !== undefined) update.net_terms = Boolean(body.netTerms);
    if (body.internalNotes !== undefined) update.internal_notes = cleanText(body.internalNotes, 2000);
    if (body.regenerateCode) update.account_code = generateAccountCode();

    if (body.status === "Approved") {
      const { data: existing } = await supabase.from("trade_accounts").select("account_code").eq("id", id).single();
      if (!existing?.account_code && !update.account_code) update.account_code = generateAccountCode();
    }

    const { data, error } = await supabase.from("trade_accounts").update(update).eq("id", id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, account: data?.[0] ? mapTradeAccount(data[0]) : null });
  } catch (error) {
    console.error("PATCH trade-accounts error:", error);
    return NextResponse.json({ error: "Could not update account" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Account id is required" }, { status: 400 });
  const { error } = await supabase.from("trade_accounts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
