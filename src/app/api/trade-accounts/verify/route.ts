import { NextResponse } from "next/server";
import { findApprovedTradeAccount } from "@/lib/tradeAccounts";
import { getStoreProductsCatalog } from "@/lib/products";

export const dynamic = "force-dynamic";

/**
 * POST { code, email } — verify a trade account at checkout.
 * Returns the account summary plus trade prices for the catalog, which the public
 * product API never exposes.
 */
export async function POST(request: Request) {
  try {
    const { code, email } = await request.json();
    const account = await findApprovedTradeAccount(code, email);
    if (!account) {
      return NextResponse.json(
        { error: "We couldn't verify that account code and email. Check both, or contact us." },
        { status: 404 }
      );
    }

    const catalog = await getStoreProductsCatalog();
    const tradePrices: Record<string, { price: number; minQty: number }> = {};
    for (const p of catalog) {
      if (p.isActive && p.wholesalePrice) tradePrices[p.id] = { price: p.wholesalePrice, minQty: p.wholesaleMinQty };
    }

    return NextResponse.json({ account, tradePrices }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Trade account verify error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
