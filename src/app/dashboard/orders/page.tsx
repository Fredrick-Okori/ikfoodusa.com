"use client";

import { useEffect, useState } from "react";
import { FileText, Printer, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BRAND, brandAddressLine } from "@/lib/brand";
import { DEVELOPER_SHARE_PERCENT } from "@/lib/finance";
import { ORDER_STATUSES, Order, OrderStatus, PAYMENT_METHODS, PAYMENT_STATUSES, PaymentStatus } from "@/lib/orders";
import { formatUSD } from "@/utils/currency";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Processing: "bg-sky-50 text-sky-800 border-sky-200",
  Shipped: "bg-forest-50 text-forest-800 border-forest-200",
  Delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Cancelled: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  Pending: "bg-red-50 text-red-700 border-red-200",
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Refunded: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
};

type Filter = "all" | "open" | "unpaid" | "delivered";
type Channel = "all" | "B2C" | "B2B";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [channel, setChannel] = useState<Channel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data?.docs) ? data.docs : []))
      .catch((err) => {
        console.warn("Failed to load orders:", err);
        setError("Couldn't load orders.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const patchOrder = async (order: Order, changes: Partial<Pick<Order, "orderStatus" | "paymentStatus">>) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...changes } : o)));
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch (err) {
      console.warn("Failed to update order:", err);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      setError(`Couldn't update ${order.orderNumber}. Please try again.`);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    if (q && ![o.orderNumber, o.customerName, o.customerEmail, o.companyName, o.poNumber].some((v) => v?.toLowerCase().includes(q))) return false;
    if (channel !== "all" && o.customerType !== channel) return false;
    if (filter === "open") return o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled";
    if (filter === "unpaid") return o.paymentStatus === "Pending" && o.orderStatus !== "Cancelled";
    if (filter === "delivered") return o.orderStatus === "Delivered";
    return true;
  });

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: orders.length },
    { id: "open", label: "Open", count: orders.filter((o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length },
    { id: "unpaid", label: "Awaiting payment", count: orders.filter((o) => o.paymentStatus === "Pending" && o.orderStatus !== "Cancelled").length },
    { id: "delivered", label: "Delivered", count: orders.filter((o) => o.orderStatus === "Delivered").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Orders</h1>
          <p className="mt-1 text-xs text-[#71717a]">Update fulfilment and payment status, and print invoices.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, name or email…"
            aria-label="Search orders"
            className="h-9 w-full rounded-full border border-beige-200 bg-white pl-9 pr-4 text-xs outline-none focus:border-forest-700"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === tab.id ? "bg-forest-900 text-secondary" : "border border-beige-200 bg-white text-[#71717a] hover:border-forest-700"
            }`}
          >
            {tab.label} ({isLoading ? "—" : tab.count})
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-beige-300" aria-hidden="true" />
        {(["all", "B2C", "B2B"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              channel === c ? "bg-forest-800 text-white" : "border border-beige-200 bg-white text-[#71717a] hover:border-forest-700"
            }`}
          >
            {c === "all" ? "All channels" : c === "B2B" ? "Business (B2B)" : "Consumer (B2C)"}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
        <div className="divide-y divide-beige-100">
          {isLoading ? (
            <p className="py-6 text-xs text-[#71717a]">Loading orders…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="py-12 text-center text-xs text-[#71717a]">No orders match this filter.</p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#e4e4e7] bg-beige-100 px-2 py-0.5 font-mono text-xs font-extrabold text-forest-950">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        order.customerType === "B2B" ? "bg-forest-900 text-secondary" : "bg-beige-100 text-forest-800"
                      }`}
                    >
                      {order.customerType}
                    </span>
                    <span className="rounded-full border border-beige-200 bg-beige-50 px-2.5 py-0.5 text-[10px] font-bold text-forest-700">
                      {PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label || order.paymentMethod}
                    </span>
                    {order.tradeAccountId && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Trade account
                      </span>
                    )}
                    <span className="text-[10px] text-[#71717a]">{new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  {order.companyName && (
                    <p className="text-sm font-bold text-forest-950">
                      {order.companyName}
                      {order.poNumber && <span className="ml-2 text-xs font-semibold text-[#71717a]">PO {order.poNumber}</span>}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-forest-950">
                    {order.customerName}
                    <span className="ml-2 text-xs font-normal text-[#71717a]">{order.customerEmail} · {order.customerPhone}</span>
                  </p>
                  <p className="text-[11px] text-[#71717a]">{order.deliveryAddress}</p>
                  <p className="text-[11px] text-[#71717a]">
                    {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                  </p>
                  {order.notes && <p className="text-[11px] italic text-forest-800">Note: {order.notes}</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm font-extrabold tracking-tight text-forest-950">{formatUSD(order.totalAmountUSD)}</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Gross profit {formatUSD(order.grossProfitUSD)}
                    </span>
                    <span className="rounded-full border border-beige-200 bg-beige-50 px-2 py-0.5 text-[10px] font-bold text-forest-700">
                      Dev share ({DEVELOPER_SHARE_PERCENT}%) {formatUSD(order.developerProfitShareUSD)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${order.id}`}>Order status</label>
                  <select
                    id={`status-${order.id}`}
                    value={order.orderStatus}
                    onChange={(e) => patchOrder(order, { orderStatus: e.target.value as OrderStatus })}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Pending}`}
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label className="sr-only" htmlFor={`payment-${order.id}`}>Payment status</label>
                  <select
                    id={`payment-${order.id}`}
                    value={order.paymentStatus}
                    onChange={(e) => patchOrder(order, { paymentStatus: e.target.value as PaymentStatus })}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${PAYMENT_STYLES[order.paymentStatus] || PAYMENT_STYLES.Pending}`}
                  >
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s === "Pending" ? "Unpaid" : s}</option>)}
                  </select>
                  <a
                    href={`/dashboard/invoices/new?order=${encodeURIComponent(order.id)}`}
                    className="flex items-center gap-1.5 rounded-full bg-forest-900 px-3.5 py-1.5 text-xs font-bold text-secondary transition hover:bg-forest-800"
                  >
                    <FileText size={13} /> Create invoice
                  </a>
                  <button
                    onClick={() => setInvoice(order)}
                    className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-3.5 py-1.5 text-xs font-bold text-forest-950 transition hover:bg-beige-100"
                  >
                    <FileText size={13} className="text-forest-700" /> Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invoice">
          <div className="relative max-h-[90vh] w-full max-w-lg space-y-6 overflow-y-auto rounded-3xl bg-white p-8 text-forest-950 shadow-2xl">
            <div className="flex items-start justify-between border-b border-beige-200 pb-4">
              <div>
                <Logo />
                <p className="mt-2 text-[10px] leading-relaxed text-[#71717a]">
                  {BRAND.legalName} · {brandAddressLine()} · {BRAND.phone}
                </p>
                <p className="mt-3 text-xs text-[#71717a]">
                  Invoice {invoice.orderNumber} · {new Date(invoice.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
              </div>
              <button
                onClick={() => setInvoice(null)}
                aria-label="Close invoice"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-beige-100 text-[#71717a] hover:bg-beige-200 print:hidden"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-beige-200 bg-beige-50 p-4">
                <p className="font-bold">Bill &amp; ship to</p>
                {invoice.companyName && <p className="mt-1 font-semibold">{invoice.companyName}</p>}
                {invoice.poNumber && <p className="text-[#52525b]">PO: {invoice.poNumber}</p>}
                <p className="mt-1 text-[#52525b]">{invoice.customerName}</p>
                <p className="text-[#52525b]">{invoice.customerEmail} · {invoice.customerPhone}</p>
                <p className="mt-0.5 text-[#52525b]">{invoice.deliveryAddress}</p>
              </div>

              <div className="space-y-2">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-beige-100 py-1.5">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-[10px] text-[#71717a]">{item.quantity} × {formatUSD(item.unitPriceUSD)}</p>
                    </div>
                    <p className="font-extrabold">{formatUSD(item.subtotalUSD)}</p>
                  </div>
                ))}
              </div>

              <dl className="space-y-1.5">
                <div className="flex justify-between"><dt className="text-[#71717a]">Subtotal</dt><dd>{formatUSD(invoice.subtotalUSD)}</dd></div>
                {invoice.discountUSD > 0 && (
                  <div className="flex justify-between"><dt className="text-[#71717a]">Discount</dt><dd>−{formatUSD(invoice.discountUSD)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-[#71717a]">Shipping</dt><dd>{invoice.shippingUSD === 0 ? "Free" : formatUSD(invoice.shippingUSD)}</dd></div>
                <div className="flex justify-between border-t border-beige-200 pt-2 text-sm font-bold">
                  <dt>Total</dt>
                  <dd className="text-xl font-extrabold">{formatUSD(invoice.totalAmountUSD)}</dd>
                </div>
              </dl>
              <p className="text-[10px] text-[#71717a]">
                Payment: {PAYMENT_METHODS.find((m) => m.id === invoice.paymentMethod)?.label || invoice.paymentMethod} ·{" "}
                {invoice.paymentStatus === "Pending" ? "Unpaid" : invoice.paymentStatus} · Questions? {BRAND.email} · {BRAND.phone}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-beige-200 pt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-forest-800"
              >
                <Printer size={15} /> Print
              </button>
              <button onClick={() => setInvoice(null)} className="rounded-full border border-beige-200 px-5 py-2.5 text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
