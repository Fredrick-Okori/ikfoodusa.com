import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { QUOTE_STATUSES, cleanText, isEmail, mapQuoteRequest } from "@/lib/b2b";

export const dynamic = "force-dynamic";

/** GET — list quote requests (dashboard). */
export async function GET() {
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message, docs: [] }, { status: 500 });
  return NextResponse.json({ docs: (data || []).map(mapQuoteRequest) }, { headers: { "Cache-Control": "no-store" } });
}

/** POST — public bulk / export quote request from /wholesale. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row = {
      company_name: cleanText(body.companyName, 255),
      contact_name: cleanText(body.contactName, 255),
      email: cleanText(body.email, 255).toLowerCase(),
      phone: cleanText(body.phone, 100),
      products: cleanText(body.products, 1000),
      quantity: cleanText(body.quantity, 255),
      frequency: cleanText(body.frequency, 100),
      delivery_location: cleanText(body.deliveryLocation, 255),
      message: cleanText(body.message, 2000),
      status: "New",
    };
    if (!row.company_name || !row.contact_name || !isEmail(row.email) || !row.products || !row.quantity) {
      return NextResponse.json(
        { error: "Company, contact name, a valid email, products and quantity are required." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("quote_requests").insert([row]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST quote-requests error:", error);
    return NextResponse.json({ error: "Could not submit quote request" }, { status: 500 });
  }
}

/** PATCH ?id= — staff updates status / notes. */
export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Quote id is required" }, { status: 400 });
    const body = await request.json();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) {
      if (!QUOTE_STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      update.status = body.status;
    }
    if (body.internalNotes !== undefined) update.internal_notes = cleanText(body.internalNotes, 2000);

    const { data, error } = await supabase.from("quote_requests").update(update).eq("id", id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, quote: data?.[0] ? mapQuoteRequest(data[0]) : null });
  } catch (error) {
    console.error("PATCH quote-requests error:", error);
    return NextResponse.json({ error: "Could not update quote request" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Quote id is required" }, { status: 400 });
  const { error } = await supabase.from("quote_requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
