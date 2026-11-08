import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import {
  INVOICE_STATUSES,
  InvoiceItem,
  InvoiceStatus,
  computeInvoiceTotals,
  mapInvoice,
  statusFromPayment,
} from "@/lib/invoices";
import { roundCents } from "@/utils/currency";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const text = (v: unknown, max = 4000) => String(v ?? "").slice(0, max);
const money = (v: unknown) => roundCents(Math.max(0, Number(v) || 0));

function cleanItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i) => ({
      description: text((i as InvoiceItem)?.description, 500).trim(),
      quantity: Math.max(0, Number((i as InvoiceItem)?.quantity) || 0),
      rate: money((i as InvoiceItem)?.rate),
    }))
    .filter((i) => i.description || i.quantity || i.rate);
}

/** Build a database row from the editor body; totals are always recomputed here. */
function toRow(body: Record<string, unknown>) {
  const items = cleanItems(body.items);
  const draft = {
    items,
    taxRate: Math.max(0, Number(body.taxRate) || 0),
    discount: money(body.discount),
    shipping: money(body.shipping),
    amountPaid: money(body.amountPaid),
  };
  const totals = computeInvoiceTotals(draft);
  const requested = INVOICE_STATUSES.includes(body.status as InvoiceStatus) ? (body.status as InvoiceStatus) : "Draft";

  return {
    status: statusFromPayment(requested, totals.total, draft.amountPaid),
    currency: text(body.currency, 3).toUpperCase() || "USD",
    issuer: text(body.issuer),
    bill_to: text(body.billTo),
    ship_to: text(body.shipTo) || null,
    customer_email: text(body.customerEmail, 255) || null,
    issue_date: text(body.issueDate, 10) || new Date().toISOString().slice(0, 10),
    due_date: text(body.dueDate, 10) || null,
    payment_terms: text(body.paymentTerms, 255) || null,
    po_number: text(body.poNumber, 100) || null,
    quantity_label: text(body.quantityLabel, 30) || "Qty",
    items,
    tax_rate: draft.taxRate,
    discount: totals.discount,
    shipping: draft.shipping,
    amount_paid: draft.amountPaid,
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    balance_due: totals.balanceDue,
    payment_details: text(body.paymentDetails) || null,
    delivery_details: text(body.deliveryDetails) || null,
    notes: text(body.notes) || null,
    order_id: body.orderId ? text(body.orderId, 60) : null,
  };
}

/** Next number in the IKF/IVC/MM/00001 series. */
async function nextInvoiceNumber() {
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
  let seq = (count || 0) + 1;
  for (let attempt = 0; attempt < 20; attempt++, seq++) {
    const candidate = `${BRAND.orderPrefix}/IVC/${month}/${String(seq).padStart(5, "0")}`;
    const { data } = await supabase.from("invoices").select("id").eq("invoice_number", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${BRAND.orderPrefix}/IVC/${month}/${Date.now().toString().slice(-6)}`;
}

/** GET → list; GET ?id= → one invoice. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404, headers: noStore });
    return NextResponse.json({ invoice: mapInvoice(data) }, { headers: noStore });
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message, docs: [] }, { status: 500, headers: noStore });
  return NextResponse.json({ docs: (data || []).map(mapInvoice) }, { headers: noStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row = toRow(body);
    if (!row.issuer.trim() || !row.bill_to.trim()) {
      return NextResponse.json({ error: "From and Invoice To are required." }, { status: 400 });
    }
    const invoiceNumber = text(body.invoiceNumber, 60).trim() || (await nextInvoiceNumber());
    const { data, error } = await supabase
      .from("invoices")
      .insert([{ ...row, invoice_number: invoiceNumber }])
      .select();
    if (error) {
      const message = error.code === "23505" ? `Invoice number ${invoiceNumber} is already in use.` : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ success: true, invoice: mapInvoice(data[0]) });
  } catch (error) {
    console.error("POST invoices error:", error);
    return NextResponse.json({ error: "Could not create invoice" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });
    const body = await request.json();

    // Quick status-only update (e.g. from the list)
    if (Object.keys(body).length === 1 && body.status) {
      if (!INVOICE_STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, invoice: data?.[0] ? mapInvoice(data[0]) : null });
    }

    const row = toRow(body);
    const update: Record<string, unknown> = { ...row, updated_at: new Date().toISOString() };
    if (body.invoiceNumber) update.invoice_number = text(body.invoiceNumber, 60).trim();

    const { data, error } = await supabase.from("invoices").update(update).eq("id", id).select();
    if (error) {
      const message = error.code === "23505" ? "That invoice number is already in use." : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ success: true, invoice: data?.[0] ? mapInvoice(data[0]) : null });
  } catch (error) {
    console.error("PATCH invoices error:", error);
    return NextResponse.json({ error: "Could not update invoice" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
