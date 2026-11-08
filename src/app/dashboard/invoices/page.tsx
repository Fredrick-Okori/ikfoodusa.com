"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, FileText, Pencil, Plus, Printer, RefreshCw, Search, Trash2, X } from "lucide-react";
import { INVOICE_STATUSES, Invoice, InvoiceStatus, formatMoney, isOverdue } from "@/lib/invoices";

const STATUS_STYLES: Record<InvoiceStatus | "Overdue", string> = {
  Draft: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
  Sent: "bg-sky-50 text-sky-800 border-sky-200",
  "Partially Paid": "bg-amber-50 text-amber-800 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Void: "bg-[#f4f4f5] text-[#a1a1aa] border-[#e4e4e7] line-through",
  Overdue: "bg-red-50 text-red-700 border-red-200",
};

type Filter = "All" | InvoiceStatus | "Overdue";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", { cache: "no-store" });
      const data = await res.json();
      if (data.error) setError(data.error);
      setInvoices(Array.isArray(data.docs) ? data.docs : []);
    } catch {
      setError("Couldn't load invoices.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter === "Overdue" && !isOverdue(inv)) return false;
      if (filter !== "All" && filter !== "Overdue" && inv.status !== filter) return false;
      if (q && ![inv.invoiceNumber, inv.billTo, inv.poNumber, inv.customerEmail].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [invoices, filter, query]);

  // Totals are only summed for USD invoices so mixed currencies aren't added together.
  const stats = useMemo(() => {
    const usd = invoices.filter((i) => i.currency === "USD" && i.status !== "Void" && i.status !== "Draft");
    return {
      invoiced: usd.reduce((s, i) => s + i.total, 0),
      outstanding: usd.reduce((s, i) => s + i.balanceDue, 0),
      overdue: usd.filter(isOverdue).reduce((s, i) => s + i.balanceDue, 0),
      drafts: invoices.filter((i) => i.status === "Draft").length,
    };
  }, [invoices]);

  const updateStatus = async (inv: Invoice, status: InvoiceStatus) => {
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status } : i)));
    const res = await fetch(`/api/invoices?id=${encodeURIComponent(inv.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
      setError(`Couldn't update ${inv.invoiceNumber}.`);
    }
  };

  const remove = async (inv: Invoice) => {
    if (!window.confirm(`Delete invoice ${inv.invoiceNumber}? This can't be undone.`)) return;
    const res = await fetch(`/api/invoices?id=${encodeURIComponent(inv.id)}`, { method: "DELETE" });
    if (res.ok) setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    else setError(`Couldn't delete ${inv.invoiceNumber}.`);
  };

  const duplicate = (inv: Invoice) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, subtotal, taxAmount, total, balanceDue, createdAt, ...draft } = inv;
    const copy = { ...draft, invoiceNumber: "", status: "Draft", amountPaid: 0, orderId: null };
    router.push(`/dashboard/invoices/new?copy=${encodeURIComponent(JSON.stringify(copy))}`);
  };

  const missingTable = error && (error.includes("schema cache") || error.includes("does not exist"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Invoices</h1>
          <p className="mt-1 text-xs text-[#71717a]">Create, edit and print invoices for retail, wholesale and export customers.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button onClick={load} disabled={isLoading} className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2.5 text-xs font-semibold hover:bg-beige-100">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
          <Link href="/dashboard/invoices/new" className="flex items-center gap-1.5 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-forest-950 hover:bg-secondary-dark">
            <Plus size={15} /> New invoice
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          {missingTable ? "The invoices table is missing. Run supabase/migrations/003_invoices.sql in the Supabase SQL editor." : error}
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Invoiced (USD)", value: formatMoney(stats.invoiced) },
          { label: "Outstanding", value: formatMoney(stats.outstanding) },
          { label: "Overdue", value: formatMoney(stats.overdue), alert: stats.overdue > 0 },
          { label: "Drafts", value: String(stats.drafts) },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.alert ? "border-red-200 bg-red-50" : "border-beige-200 bg-white"}`}>
            <p className="text-[11px] font-semibold text-[#71717a]">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-forest-950">{isLoading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", ...INVOICE_STATUSES, "Overdue"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filter === f ? "bg-forest-900 text-secondary" : "border border-beige-200 bg-white text-[#71717a] hover:border-forest-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search number, customer, PO…"
            aria-label="Search invoices"
            className="h-9 w-full rounded-full border border-beige-200 bg-white pl-9 pr-4 text-xs outline-none focus:border-forest-700"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-beige-200 bg-white shadow-2xs">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-beige-200 text-left text-[10px] uppercase tracking-wider text-[#71717a]">
              <th className="px-5 py-3 font-bold">Invoice</th>
              <th className="px-3 py-3 font-bold">Customer</th>
              <th className="px-3 py-3 font-bold">Date</th>
              <th className="px-3 py-3 font-bold">Due</th>
              <th className="px-3 py-3 text-right font-bold">Total</th>
              <th className="px-3 py-3 text-right font-bold">Balance</th>
              <th className="px-3 py-3 font-bold">Status</th>
              <th className="px-5 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-xs text-[#71717a]">Loading invoices…</td></tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#71717a]">
                  <FileText size={28} className="mx-auto mb-2 text-[#d4d4d8]" />
                  {invoices.length === 0 ? "No invoices yet. Create your first one." : "No invoices match this filter."}
                </td>
              </tr>
            ) : (
              visible.map((inv) => {
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} className="hover:bg-beige-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-xs font-bold text-forest-950 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                      {inv.poNumber && <p className="text-[10px] text-[#71717a]">PO {inv.poNumber}</p>}
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="truncate font-semibold text-forest-950">{inv.billTo.split("\n")[0]}</p>
                      <p className="truncate text-[11px] text-[#71717a]">{inv.billTo.split("\n").slice(1, 2).join("")}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#52525b]">{inv.issueDate}</td>
                    <td className={`px-3 py-3 text-xs ${overdue ? "font-bold text-red-700" : "text-[#52525b]"}`}>
                      {inv.dueDate || "—"}
                      {overdue && <AlertTriangle size={12} className="ml-1 inline" />}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(inv.total, inv.currency)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{formatMoney(inv.balanceDue, inv.currency)}</td>
                    <td className="px-3 py-3">
                      <label className="sr-only" htmlFor={`st-${inv.id}`}>Status for {inv.invoiceNumber}</label>
                      <select
                        id={`st-${inv.id}`}
                        value={inv.status}
                        onChange={(e) => updateStatus(inv, e.target.value as InvoiceStatus)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold outline-none ${STATUS_STYLES[overdue ? "Overdue" : inv.status]}`}
                      >
                        {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/invoices/${inv.id}`} aria-label={`Edit ${inv.invoiceNumber}`} className="rounded-full p-2 text-[#71717a] hover:bg-beige-100 hover:text-forest-950">
                          <Pencil size={14} />
                        </Link>
                        <Link href={`/dashboard/invoices/${inv.id}?print=1`} aria-label={`Print ${inv.invoiceNumber}`} className="rounded-full p-2 text-[#71717a] hover:bg-beige-100 hover:text-forest-950">
                          <Printer size={14} />
                        </Link>
                        <button onClick={() => duplicate(inv)} aria-label={`Duplicate ${inv.invoiceNumber}`} className="rounded-full p-2 text-[#71717a] hover:bg-beige-100 hover:text-forest-950">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => remove(inv)} aria-label={`Delete ${inv.invoiceNumber}`} className="rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
