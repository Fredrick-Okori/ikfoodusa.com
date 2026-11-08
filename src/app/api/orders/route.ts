import { NextResponse } from "next/server";
import { saveOrderToSupabase, supabase } from "@/lib/supabase";
import {
  generateOrderNumber,
  getOrdersCatalog,
  invalidateOrdersCache,
  mapSupabaseOrder,
  OrderItem,
  PAYMENT_METHODS,
} from "@/lib/orders";
import { getStoreProductsCatalog, invalidateProductCache } from "@/lib/products";
import { computeTotals } from "@/lib/promotions";
import { DEVELOPER_SHARE_RATE, developerShare, lineGrossProfit } from "@/lib/finance";
import { roundCents } from "@/utils/currency";
import { unitPriceFor } from "@/lib/pricing";
import { findApprovedTradeAccount } from "@/lib/tradeAccounts";
import { cleanText } from "@/lib/b2b";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await getOrdersCatalog();
    return NextResponse.json({ docs: orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({ docs: [] }, { status: 500 });
  }
}

interface IncomingItem {
  productId?: string;
  productName?: string;
  quantity?: number;
}

/**
 * Create an order. Prices, shipping, discounts and profit are recalculated on the
 * server from the live catalog so the browser cannot change what is charged.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["customerName", "customerEmail", "customerPhone", "deliveryAddress"];
    const missing = required.filter((key) => !String(body[key] || "").trim());
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const incoming: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    if (incoming.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    // B2B: a verified trade account unlocks trade pricing and (if enabled) Net-30 invoices.
    let tradeAccount = null;
    if (body.tradeAccountCode) {
      tradeAccount = await findApprovedTradeAccount(body.tradeAccountCode, body.customerEmail);
      if (!tradeAccount) {
        return NextResponse.json(
          { error: "Your trade account code couldn't be verified with this email address." },
          { status: 403 }
        );
      }
    }
    const isTrade = Boolean(tradeAccount);
    const companyName = tradeAccount?.companyName || cleanText(body.companyName, 255) || null;
    const customerType = isTrade || companyName ? "B2B" : "B2C";

    const catalog = await getStoreProductsCatalog();
    const byId = new Map(catalog.map((p) => [p.id, p]));

    const items: OrderItem[] = [];
    for (const line of incoming) {
      const product = line.productId ? byId.get(String(line.productId)) : undefined;
      const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
      if (!product) {
        return NextResponse.json(
          { error: `"${line.productName || "An item"}" is no longer available. Please refresh your cart.` },
          { status: 409 }
        );
      }
      if (!product.inStock || quantity > product.stockQuantity) {
        return NextResponse.json(
          { error: `Only ${product.stockQuantity} of "${product.name}" left in stock.` },
          { status: 409 }
        );
      }
      const unit = unitPriceFor(product, quantity, isTrade);
      const grossProfitUSD = lineGrossProfit({
        unitPriceUSD: unit.price,
        unitBuyingPriceUSD: product.buyingPrice,
        quantity,
      });
      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPriceUSD: unit.price,
        subtotalUSD: roundCents(unit.price * quantity),
        priceSource: unit.source,
        unitBuyingPriceUSD: product.buyingPrice,
        grossProfitUSD,
        developerProfitShareUSD: developerShare(grossProfitUSD),
      });
    }

    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotalUSD, 0);
    // Promo codes are for retail shoppers; trade accounts already get trade pricing.
    const totals = computeTotals(itemsSubtotal, isTrade ? null : body.promoCode);
    // Discounts reduce profit; spread proportionally so the settlement stays honest.
    const grossProfitUSD = roundCents(
      Math.max(0, items.reduce((sum, item) => sum + (item.grossProfitUSD || 0), 0) - totals.discount)
    );
    const developerProfitShareUSD = developerShare(grossProfitUSD);

    const paymentMethod = PAYMENT_METHODS.some((m) => m.id === body.paymentMethod)
      ? body.paymentMethod
      : PAYMENT_METHODS[0].id;
    if (paymentMethod === "Invoice" && !tradeAccount?.netTerms) {
      return NextResponse.json(
        { error: "Net-30 invoicing is only available to approved trade accounts with invoice terms." },
        { status: 403 }
      );
    }

    const saved = await saveOrderToSupabase({
      order_number: generateOrderNumber(),
      customer_name: String(body.customerName).trim(),
      customer_email: String(body.customerEmail).trim(),
      customer_phone: String(body.customerPhone).trim(),
      delivery_address: String(body.deliveryAddress).trim(),
      order_status: "Pending",
      payment_method: paymentMethod,
      payment_status: "Pending",
      subtotal_usd: totals.subtotal,
      shipping_usd: totals.shipping,
      discount_usd: totals.discount,
      total_amount_usd: totals.total,
      commission_rate: DEVELOPER_SHARE_RATE,
      gross_profit_usd: grossProfitUSD,
      developer_profit_share_usd: developerProfitShareUSD,
      store_profit_usd: roundCents(grossProfitUSD - developerProfitShareUSD),
      notes: body.notes ? String(body.notes).slice(0, 1000) : null,
      customer_type: customerType,
      company_name: companyName,
      po_number: cleanText(body.poNumber, 100) || null,
      trade_account_id: tradeAccount?.id || null,
      items,
    });

    if (saved.error || !saved.data) {
      console.warn("Order save notice:", saved.error);
      return NextResponse.json({ success: false, error: saved.error || "Order could not be saved" }, { status: 503 });
    }

    // Decrement stock for each purchased product (best effort).
    await Promise.all(
      items.map((item) => {
        const product = byId.get(String(item.productId));
        if (!product) return null;
        return supabase
          .from("products")
          .update({ quantity_in_stock: Math.max(0, product.stockQuantity - item.quantity) })
          .eq("id", product.id);
      })
    );
    invalidateProductCache();
    invalidateOrdersCache();

    return NextResponse.json({ success: true, order: mapSupabaseOrder(saved.data) });
  } catch (error) {
    console.error("Order POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const orderNumber = searchParams.get("orderNumber");
    const body = await request.json();

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.orderStatus !== undefined) updatePayload.order_status = body.orderStatus;
    if (body.paymentStatus !== undefined) updatePayload.payment_status = body.paymentStatus;
    if (body.deliveryAddress !== undefined) updatePayload.delivery_address = body.deliveryAddress;
    if (body.customerPhone !== undefined) updatePayload.customer_phone = body.customerPhone;

    let query = supabase.from("orders").update(updatePayload);
    if (id) {
      query = query.eq("id", id);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else {
      return NextResponse.json({ error: "Order id or orderNumber is required" }, { status: 400 });
    }

    const { data, error } = await query.select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateOrdersCache();
    return NextResponse.json({ success: true, order: data?.[0] ? mapSupabaseOrder(data[0]) : null });
  } catch (error) {
    console.error("PATCH order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateOrdersCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
