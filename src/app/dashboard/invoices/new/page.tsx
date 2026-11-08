"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { InvoiceEditor } from "@/components/dashboard/InvoiceEditor";
import { InvoiceDraft, addDaysISO, emptyInvoiceDraft, todayISO } from "@/lib/invoices";
import { Order, PAYMENT_METHODS } from "@/lib/orders";

/** Prefill an invoice from a storefront order. */
function draftFromOrder(order: Order): InvoiceDraft {
  const base = emptyInvoiceDraft();
  const billTo = [order.companyName, order.customerName, order.deliveryAddress, order.customerPhone, order.customerEmail]
    .filter(Boolean)
    .join("\n");
  return {
    ...base,
    billTo,
    customerEmail: order.customerEmail,
    poNumber: order.poNumber || "",
    paymentTerms: order.paymentMethod === "Invoice" ? "Net 30" : base.paymentTerms,
    dueDate: order.paymentMethod === "Invoice" ? addDaysISO(todayISO(), 30) : base.dueDate,
    quantityLabel: "Qty",
    items: order.items.map((i) => ({ description: i.productName, quantity: i.quantity, rate: i.unitPriceUSD })),
    discount: order.discountUSD,
    shipping: order.shippingUSD,
    amountPaid: order.paymentStatus === "Paid" ? order.totalAmountUSD : 0,
    notes: `Order ${order.orderNumber} · Payment method: ${
      PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label || order.paymentMethod
    }`,
    orderId: order.id,
  };
}

function NewInvoice() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const copy = params.get("copy");
  const [draft, setDraft] = useState<InvoiceDraft | null>(() => {
    if (copy) {
      try {
        return { ...emptyInvoiceDraft(), ...JSON.parse(copy), issueDate: todayISO(), dueDate: addDaysISO(todayISO(), 7) };
      } catch {}
    }
    return orderId ? null : emptyInvoiceDraft();
  });

  useEffect(() => {
    if (!orderId) return;
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const order = (data?.docs as Order[] | undefined)?.find((o) => o.id === orderId);
        setDraft(order ? draftFromOrder(order) : emptyInvoiceDraft());
      })
      .catch(() => setDraft(emptyInvoiceDraft()));
  }, [orderId]);

  if (!draft) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#71717a]">
        <Loader2 size={16} className="animate-spin" /> Loading order…
      </p>
    );
  }
  return <InvoiceEditor initial={draft} />;
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={null}>
      <NewInvoice />
    </Suspense>
  );
}
