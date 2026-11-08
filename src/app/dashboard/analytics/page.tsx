"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { Product } from "@/data/products";
import { Order } from "@/lib/orders";
import { DEVELOPER_SHARE_PERCENT, STORE_SHARE_PERCENT } from "@/lib/finance";
import { storageKey } from "@/lib/brand";
import { formatUSD, roundCents } from "@/utils/currency";

function Skeleton({ w = "w-40" }: { w?: string }) {
  return <div className={`my-1 h-9 ${w} animate-pulse rounded-md bg-[#e4e4e7]`} />;
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("Manager");

  const isPrivileged = ["superadmin", "manager", "admin"].includes(userRole.toLowerCase());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const storedRole = localStorage.getItem(storageKey("user_role"));
      if (storedRole) setUserRole(storedRole);
      const [orderRes, productRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/store-products?all=1", { cache: "no-store" }),
      ]);
      const [orderData, productData] = await Promise.all([orderRes.json(), productRes.json()]);
      setOrders(Array.isArray(orderData?.docs) ? orderData.docs : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      console.warn("Failed to fetch analytics data:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.orderStatus !== "Cancelled");
    const categoryOf = new Map<string, string>();
    products.forEach((p) => {
      categoryOf.set(p.id, p.category);
      categoryOf.set(p.name.toLowerCase(), p.category);
    });

    const byCategory = new Map<string, number>();
    const byProduct = new Map<string, { revenue: number; units: number }>();
    valid.forEach((o) =>
      o.items.forEach((item) => {
        const category =
          (item.productId && categoryOf.get(item.productId)) ||
          categoryOf.get(item.productName.toLowerCase()) ||
          "Uncategorized";
        const revenue = item.subtotalUSD || item.unitPriceUSD * item.quantity || 0;
        byCategory.set(category, (byCategory.get(category) || 0) + revenue);
        const current = byProduct.get(item.productName) || { revenue: 0, units: 0 };
        byProduct.set(item.productName, { revenue: current.revenue + revenue, units: current.units + item.quantity });
      })
    );

    const categoryTotal = [...byCategory.values()].reduce((a, b) => a + b, 0) || 1;
    const sales = roundCents(valid.reduce((sum, o) => sum + o.totalAmountUSD, 0));

    return {
      count: valid.length,
      sales,
      averageOrder: valid.length ? roundCents(sales / valid.length) : 0,
      grossProfit: roundCents(valid.reduce((sum, o) => sum + o.grossProfitUSD, 0)),
      devShare: roundCents(valid.reduce((sum, o) => sum + o.developerProfitShareUSD, 0)),
      storeProfit: roundCents(valid.reduce((sum, o) => sum + o.storeProfitUSD, 0)),
      categories: [...byCategory.entries()]
        .map(([name, revenue]) => ({ name, revenue: roundCents(revenue), pct: Math.round((revenue / categoryTotal) * 100) }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: [...byProduct.entries()]
        .map(([name, v]) => ({ name, revenue: roundCents(v.revenue), units: v.units }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Analytics</h1>
          <p className="mt-1 text-xs text-[#71717a]">
            Revenue and product performance across {isLoading ? "—" : stats.count} non-cancelled orders (USD).
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-semibold text-forest-950 transition hover:bg-beige-100"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {!isPrivileged && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <ShieldCheck size={20} className="shrink-0 text-forest-700" />
          <div>
            <p className="font-bold">Staff view ({userRole})</p>
            <p className="text-[11px] text-amber-800/80">Profit figures are limited to managers and superadmins.</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${isPrivileged ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2"}`}>
        <div className="space-y-2 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Sales</p>
          {isLoading ? <Skeleton /> : <p className="text-3xl font-extrabold tracking-tight text-forest-950">{formatUSD(stats.sales)}</p>}
          <span className="inline-flex items-center gap-1 rounded-full bg-beige-100 px-2.5 py-0.5 text-xs font-bold text-forest-700">
            <TrendingUp size={13} /> Avg. order {formatUSD(stats.averageOrder)}
          </span>
        </div>
        {isPrivileged ? (
          <>
            <div className="space-y-2 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Gross profit</p>
              {isLoading ? <Skeleton /> : <p className="text-3xl font-extrabold tracking-tight text-forest-950">{formatUSD(stats.grossProfit)}</p>}
              <span className="text-[11px] text-[#71717a]">All non-cancelled orders</span>
            </div>
            <div className="space-y-2 rounded-3xl border border-forest-200 bg-forest-50 p-6 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-forest-700">Developer share ({DEVELOPER_SHARE_PERCENT}%)</p>
              {isLoading ? <Skeleton /> : <p className="text-3xl font-extrabold tracking-tight text-forest-800">{formatUSD(stats.devShare)}</p>}
              <span className="text-[11px] text-[#71717a]">Accrued; settled once orders are delivered</span>
            </div>
            <div className="space-y-2 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Store profit ({STORE_SHARE_PERCENT}%)</p>
              {isLoading ? <Skeleton /> : <p className="text-3xl font-extrabold tracking-tight text-emerald-700">{formatUSD(stats.storeProfit)}</p>}
              <span className="text-[11px] text-[#71717a]">After developer share</span>
            </div>
          </>
        ) : (
          <div className="space-y-2 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Orders</p>
            {isLoading ? <Skeleton w="w-20" /> : <p className="text-3xl font-extrabold tracking-tight text-forest-950">{stats.count}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-beige-200 bg-white p-8 shadow-2xs">
          <h2 className="text-lg font-bold text-forest-950">Sales by category</h2>
          {isLoading ? (
            <p className="text-xs text-[#71717a]">Loading…</p>
          ) : stats.categories.length === 0 ? (
            <p className="text-xs text-[#71717a]">No sales yet.</p>
          ) : (
            <ul className="space-y-4 text-xs">
              {stats.categories.map((c, i) => (
                <li key={c.name}>
                  <div className="mb-1.5 flex justify-between font-bold">
                    <span>{c.name}</span>
                    <span>
                      {formatUSD(c.revenue)} <span className="font-normal text-[#71717a]">({c.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-beige-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${i === 0 ? "bg-forest-900" : i === 1 ? "bg-secondary-dark" : "bg-forest-400"}`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-beige-200 bg-white p-8 shadow-2xs">
          <h2 className="text-lg font-bold text-forest-950">Top products</h2>
          {isLoading ? (
            <p className="text-xs text-[#71717a]">Loading…</p>
          ) : stats.topProducts.length === 0 ? (
            <p className="text-xs text-[#71717a]">No sales yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#71717a]">
                  <th className="pb-2 font-bold">Product</th>
                  <th className="pb-2 text-right font-bold">Units</th>
                  <th className="pb-2 text-right font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100">
                {stats.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2 pr-3 font-semibold text-forest-950">{p.name}</td>
                    <td className="py-2 text-right tabular-nums">{p.units}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{formatUSD(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
