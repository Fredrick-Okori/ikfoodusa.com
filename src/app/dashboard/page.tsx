"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  ShoppingBag,
  Code2,
  Coins,
  CreditCard,
  FileText,
  Leaf,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Product } from "@/data/products";
import { Order, PAYMENT_METHODS } from "@/lib/orders";
import { DEVELOPER_SHARE_PERCENT, DEVELOPER_SHARE_RATE, STORE_SHARE_PERCENT, developerShare } from "@/lib/finance";
import { ProductImage } from "@/components/ProductImage";
import { formatUSD, roundCents } from "@/utils/currency";

type QuickRange = "all" | "today" | "this_month" | "last_month";

const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  Card: CreditCard,
  PayPal: Wallet,
  Zelle: Banknote,
  Invoice: FileText,
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  isLoading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof CreditCard;
  tone?: "default" | "accent" | "success" | "warning";
  isLoading: boolean;
}) {
  const tones = {
    default: { card: "border-beige-200 bg-white", icon: "bg-forest-900 text-secondary" },
    accent: { card: "border-forest-200 bg-forest-50", icon: "bg-secondary text-forest-950" },
    success: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-600 text-white" },
    warning: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-500 text-white" },
  }[tone];

  return (
    <div className={`flex min-h-[120px] min-w-0 items-center gap-4 rounded-2xl border p-5 shadow-2xs ${tones.card}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones.icon}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-[#71717a]">{label}</span>
        {isLoading ? (
          <div className="my-1 h-7 w-28 animate-pulse rounded-md bg-[#e4e4e7]" />
        ) : (
          <p className="break-words text-xl font-extrabold tracking-tight text-forest-950 sm:text-2xl">{value}</p>
        )}
        {sub && <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">{sub}</span>}
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quickRange, setQuickRange] = useState<QuickRange>("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch("/api/store-products?all=1", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      const [prodData, orderData] = await Promise.all([
        prodRes.json().catch(() => []),
        orderRes.json().catch(() => ({ docs: [] })),
      ]);
      setProductsList(Array.isArray(prodData) ? prodData : []);
      setOrders(Array.isArray(orderData?.docs) ? orderData.docs : []);
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    return orders.filter((o) => {
      const orderDate = (o.createdAt || todayStr).slice(0, 10);
      if (quickRange === "today") return orderDate === todayStr;
      if (quickRange === "this_month") return orderDate.startsWith(todayStr.slice(0, 7));
      if (quickRange === "last_month") return orderDate.startsWith(lastMonthStr);
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
      return true;
    });
  }, [orders, quickRange, fromDate, toDate]);

  const finances = useMemo(() => {
    const valid = filteredOrders.filter((o) => o.orderStatus !== "Cancelled");
    const completed = valid.filter((o) => o.orderStatus === "Delivered");
    const sum = (list: Order[], pick: (o: Order) => number) => roundCents(list.reduce((acc, o) => acc + pick(o), 0));

    const grossProfit = sum(completed, (o) => o.grossProfitUSD);
    const devShare = developerShare(grossProfit);

    return {
      inventoryValue: roundCents(productsList.reduce((acc, p) => acc + p.numericPrice * (p.stockQuantity ?? 0), 0)),
      unitsInStock: productsList.reduce((acc, p) => acc + (p.stockQuantity ?? 0), 0),
      totalSales: sum(valid, (o) => o.totalAmountUSD),
      received: sum(valid.filter((o) => o.paymentStatus === "Paid"), (o) => o.totalAmountUSD),
      awaitingPayment: sum(valid.filter((o) => o.paymentStatus === "Pending"), (o) => o.totalAmountUSD),
      grossProfit,
      devShare,
      storeProfit: roundCents(grossProfit - devShare),
      orderCount: valid.length,
      b2bSales: sum(valid.filter((o) => o.customerType === "B2B"), (o) => o.totalAmountUSD),
      b2cSales: sum(valid.filter((o) => o.customerType !== "B2B"), (o) => o.totalAmountUSD),
      b2bCount: valid.filter((o) => o.customerType === "B2B").length,
      completedCount: completed.length,
      byPayment: PAYMENT_METHODS.map((m) => ({
        ...m,
        total: sum(valid.filter((o) => o.paymentMethod === m.id), (o) => o.totalAmountUSD),
        count: valid.filter((o) => o.paymentMethod === m.id).length,
      })),
    };
  }, [filteredOrders, productsList]);

  const lowStock = useMemo(
    () => [...productsList].sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0)).slice(0, 5),
    [productsList]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-forest-950">Overview</h1>
            <p className="text-xs text-[#71717a]">Sales, profit and stock across the store. All amounts in USD.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-forest-950">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setQuickRange("all");
                }}
                className="rounded-full border border-beige-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-forest-700"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-forest-950">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setQuickRange("all");
                }}
                className="rounded-full border border-beige-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-forest-700"
              />
            </label>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-forest-800"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-beige-100 pt-4">
          {(
            [
              { id: "all", label: "All time" },
              { id: "today", label: "Today" },
              { id: "this_month", label: "This month" },
              { id: "last_month", label: "Last month" },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                setQuickRange(pill.id);
                setFromDate("");
                setToDate("");
              }}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                quickRange === pill.id && !fromDate && !toDate
                  ? "bg-forest-900 text-secondary"
                  : "bg-beige-100 text-[#71717a] hover:bg-beige-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard isLoading={isLoading} icon={TrendingUp} label="Total sales" value={formatUSD(finances.totalSales)} sub={`${finances.orderCount} orders`} />
        <StatCard isLoading={isLoading} icon={CreditCard} label="Payments received" value={formatUSD(finances.received)} sub="Marked paid" tone="accent" />
        <StatCard isLoading={isLoading} icon={FileText} label="Awaiting payment" value={formatUSD(finances.awaitingPayment)} sub="Pending invoices" tone="warning" />
        <StatCard isLoading={isLoading} icon={ShieldCheck} label="Orders delivered" value={String(finances.completedCount)} sub="Completed" tone="success" />
        <StatCard isLoading={isLoading} icon={Leaf} label="Inventory value" value={formatUSD(finances.inventoryValue)} sub={`${finances.unitsInStock} units at retail`} />
        <StatCard isLoading={isLoading} icon={Coins} label="Gross profit (delivered)" value={formatUSD(finances.grossProfit)} sub="After discounts" />
        <StatCard isLoading={isLoading} icon={Code2} label={`Developer share (${DEVELOPER_SHARE_PERCENT}%)`} value={formatUSD(finances.devShare)} sub="Of delivered gross profit" tone="accent" />
        <StatCard isLoading={isLoading} icon={Wallet} label={`Store profit (${STORE_SHARE_PERCENT}%)`} value={formatUSD(finances.storeProfit)} sub="Retained" tone="success" />
      </div>

      <div className="rounded-3xl border border-beige-200 bg-beige-50 p-5 text-xs text-[#71717a]">
        <span className="mr-2 rounded border border-beige-200 bg-white px-2 py-0.5 font-mono font-bold text-forest-950">
          Developer share = delivered gross profit × {DEVELOPER_SHARE_RATE}
        </span>
        Gross profit is selling price minus cost price for each item, less discounts. Set cost prices on products for accurate numbers.
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]">Sales by channel</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            isLoading={isLoading}
            icon={ShoppingBag}
            label="Consumer (B2C)"
            value={formatUSD(finances.b2cSales)}
            sub={`${finances.orderCount - finances.b2bCount} orders`}
          />
          <StatCard
            isLoading={isLoading}
            icon={Building2}
            label="Business (B2B)"
            value={formatUSD(finances.b2bSales)}
            sub={`${finances.b2bCount} orders`}
            tone="accent"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]">Payment breakdown</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {finances.byPayment.map((m) => (
            <StatCard
              key={m.id}
              isLoading={isLoading}
              icon={PAYMENT_ICONS[m.id] || CreditCard}
              label={m.label}
              value={formatUSD(m.total)}
              sub={`${m.count} ${m.count === 1 ? "order" : "orders"}`}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-beige-100 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-forest-950">
              <PackageCheck size={18} className="text-forest-700" /> Recent orders
            </h2>
            <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-beige-100">
            {isLoading ? (
              <p className="py-3 text-xs text-[#71717a]">Loading…</p>
            ) : filteredOrders.length === 0 ? (
              <p className="py-3 text-xs text-[#71717a]">No orders in this period.</p>
            ) : (
              filteredOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-forest-950">
                      {order.orderNumber}
                      <span className="ml-2 font-sans text-[10px] font-normal text-[#71717a]">{order.createdAt.slice(0, 10)}</span>
                    </p>
                    <p className="text-xs font-semibold text-forest-950">{order.customerName}</p>
                    <p className="max-w-[240px] truncate text-[11px] text-[#71717a]">{order.deliveryAddress}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="block text-xs font-bold text-forest-700">{formatUSD(order.totalAmountUSD)}</span>
                    <span className="inline-block rounded-full bg-beige-100 px-2.5 py-0.5 text-[10px] font-bold text-forest-800">
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-beige-100 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-forest-950">
              <Leaf size={18} className="text-forest-700" /> Lowest stock
            </h2>
            <Link href="/dashboard/products" className="flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline">
              Manage products <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-beige-100">
            {isLoading ? (
              <p className="py-3 text-xs text-[#71717a]">Loading…</p>
            ) : lowStock.length === 0 ? (
              <p className="py-3 text-xs text-[#71717a]">No products yet.</p>
            ) : (
              lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/products/${p.id}/edit`}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-beige-200 bg-beige-50">
                      <ProductImage src={p.image} alt={p.name} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-forest-950">{p.name}</p>
                      <p className="text-[10px] text-[#71717a]">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-forest-700">{formatUSD(p.numericPrice)}</span>
                    <span className={`text-[10px] font-semibold ${(p.stockQuantity ?? 0) <= 10 ? "text-red-600" : "text-[#71717a]"}`}>
                      {p.stockQuantity ?? 0} in stock
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
