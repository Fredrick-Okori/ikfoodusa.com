"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Copy, FileText, Loader2, Mail, RefreshCw, Trash2, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  QUOTE_STATUSES,
  QuoteRequest,
  QuoteStatus,
  TRADE_ACCOUNT_STATUSES,
  TradeAccount,
  TradeAccountStatus,
} from "@/lib/b2b";

type Tab = "accounts" | "quotes";

const ACCOUNT_STYLES: Record<TradeAccountStatus, string> = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Rejected: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
  Suspended: "bg-red-50 text-red-700 border-red-200",
};

const QUOTE_STYLES: Record<QuoteStatus, string> = {
  New: "bg-amber-50 text-amber-800 border-amber-200",
  Contacted: "bg-sky-50 text-sky-800 border-sky-200",
  Quoted: "bg-forest-50 text-forest-800 border-forest-200",
  Won: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Lost: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function approvalEmail(a: TradeAccount) {
  const subject = `Your ${BRAND.name} trade account is approved`;
  const body = [
    `Hi ${a.contactName.split(" ")[0] || "there"},`,
    "",
    `Your trade account for ${a.companyName} has been approved.`,
    "",
    `Trade account code: ${a.accountCode}`,
    `Account email: ${a.email}`,
    "",
    `To order at trade prices, add products to your cart at ${BRAND.url}, open "Have a trade account?" in the order summary and enter the code and email above.`,
    a.netTerms ? "Net-30 invoice payment is enabled for your account." : "",
    "",
    `Thank you,`,
    BRAND.name,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
  return `mailto:${a.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function WholesaleDashboardPage() {
  const [tab, setTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<TradeAccount[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<TradeAccountStatus | "All">("All");

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [a, q] = await Promise.all([
        fetch("/api/trade-accounts", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/quote-requests", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (a.error || q.error) setError(a.error || q.error);
      setAccounts(Array.isArray(a.docs) ? a.docs : []);
      setQuotes(Array.isArray(q.docs) ? q.docs : []);
    } catch {
      setError("Couldn't load wholesale data.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateAccount = async (account: TradeAccount, changes: Record<string, unknown>) => {
    setBusyId(account.id);
    setError(null);
    try {
      const data = await send(`/api/trade-accounts?id=${encodeURIComponent(account.id)}`, "PATCH", changes);
      if (data.account) setAccounts((prev) => prev.map((a) => (a.id === account.id ? data.account : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
    setBusyId(null);
  };

  const updateQuote = async (quote: QuoteRequest, changes: Record<string, unknown>) => {
    setBusyId(quote.id);
    setError(null);
    try {
      const data = await send(`/api/quote-requests?id=${encodeURIComponent(quote.id)}`, "PATCH", changes);
      if (data.quote) setQuotes((prev) => prev.map((q) => (q.id === quote.id ? data.quote : q)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
    setBusyId(null);
  };

  const remove = async (kind: "account" | "quote", id: string, name: string) => {
    if (!window.confirm(`Delete ${kind === "account" ? "the trade account for" : "the quote request from"} ${name}?`)) return;
    setBusyId(id);
    try {
      await send(`/api/${kind === "account" ? "trade-accounts" : "quote-requests"}?id=${encodeURIComponent(id)}`, "DELETE");
      if (kind === "account") setAccounts((prev) => prev.filter((a) => a.id !== id));
      else setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
    setBusyId(null);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const visibleAccounts = useMemo(
    () => accounts.filter((a) => accountFilter === "All" || a.status === accountFilter),
    [accounts, accountFilter]
  );
  const pendingCount = accounts.filter((a) => a.status === "Pending").length;
  const newQuotes = quotes.filter((q) => q.status === "New").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Wholesale (B2B)</h1>
          <p className="mt-1 text-xs text-[#71717a]">
            Approve trade accounts and follow up on bulk and export quote requests from the{" "}
            <a href="/wholesale" target="_blank" className="underline">wholesale page</a>.
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-semibold text-forest-950 hover:bg-beige-100"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Pending applications", value: pendingCount },
          { label: "Approved accounts", value: accounts.filter((a) => a.status === "Approved").length },
          { label: "New quote requests", value: newQuotes },
          { label: "Quotes won", value: quotes.filter((q) => q.status === "Won").length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-beige-200 bg-white p-5">
            <p className="text-[11px] font-semibold text-[#71717a]">{stat.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-forest-950">{isLoading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "accounts", label: `Trade accounts${pendingCount ? ` (${pendingCount} pending)` : ""}`, icon: Building2 },
            { id: "quotes", label: `Quote requests${newQuotes ? ` (${newQuotes} new)` : ""}`, icon: FileText },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === id ? "bg-forest-900 text-secondary" : "border border-beige-200 bg-white text-[#71717a] hover:border-forest-700"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          {error.includes("does not exist") || error.includes("schema cache")
            ? "Wholesale tables are missing. Run supabase/migrations/002_b2b.sql in the Supabase SQL editor."
            : error}
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {tab === "accounts" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["All", ...TRADE_ACCOUNT_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAccountFilter(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  accountFilter === s ? "bg-forest-800 text-white" : "bg-beige-100 text-[#71717a] hover:bg-beige-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-xs text-[#71717a]">Loading…</p>
          ) : visibleAccounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-beige-300 bg-white p-10 text-center text-sm text-[#71717a]">
              No trade accounts here yet. Applications from /wholesale appear in this list.
            </div>
          ) : (
            visibleAccounts.map((a) => (
              <div key={a.id} className="space-y-4 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-forest-950">{a.companyName}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${ACCOUNT_STYLES[a.status]}`}>{a.status}</span>
                      {a.businessType && (
                        <span className="rounded-full bg-beige-100 px-2.5 py-0.5 text-[10px] font-bold text-forest-800">{a.businessType}</span>
                      )}
                    </div>
                    <p className="text-sm text-forest-900">
                      {a.contactName} · <a href={`mailto:${a.email}`} className="underline">{a.email}</a>
                      {a.phone && ` · ${a.phone}`}
                    </p>
                    <p className="text-xs text-[#71717a]">
                      {[a.taxId && `EIN/resale: ${a.taxId}`, a.expectedVolume && `Volume: ${a.expectedVolume}`, a.website, a.address]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.message && <p className="text-xs italic text-forest-800">“{a.message}”</p>}
                    <p className="text-[10px] text-[#a1a1aa]">Applied {new Date(a.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {a.status !== "Approved" && (
                      <button
                        onClick={() => updateAccount(a, { status: "Approved" })}
                        disabled={busyId === a.id}
                        className="flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-xs font-bold text-white hover:bg-forest-800 disabled:opacity-50"
                      >
                        {busyId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                      </button>
                    )}
                    <label className="sr-only" htmlFor={`status-${a.id}`}>Status</label>
                    <select
                      id={`status-${a.id}`}
                      value={a.status}
                      disabled={busyId === a.id}
                      onChange={(e) => updateAccount(a, { status: e.target.value })}
                      className="rounded-full border border-beige-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                    >
                      {TRADE_ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => remove("account", a.id, a.companyName)}
                      aria-label={`Delete ${a.companyName}`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {a.status === "Approved" && a.accountCode && (
                  <div className="flex flex-col gap-3 rounded-2xl bg-forest-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-forest-800">Account code</span>
                      <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-forest-950">{a.accountCode}</code>
                      <button
                        onClick={() => copy(a.accountCode!)}
                        className="flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline"
                      >
                        <Copy size={12} /> {copied === a.accountCode ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Issue a new code? The old code stops working immediately.")) {
                            updateAccount(a, { regenerateCode: true });
                          }
                        }}
                        className="text-xs font-semibold text-[#71717a] hover:underline"
                      >
                        New code
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-forest-900">
                        <input
                          type="checkbox"
                          checked={a.netTerms}
                          disabled={busyId === a.id}
                          onChange={(e) => updateAccount(a, { netTerms: e.target.checked })}
                          className="h-4 w-4 accent-forest-700"
                        />
                        Net-30 invoicing
                      </label>
                      <a
                        href={approvalEmail(a)}
                        className="flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-xs font-bold text-secondary hover:bg-forest-800"
                      >
                        <Mail size={13} /> Email code to customer
                      </a>
                    </div>
                  </div>
                )}

                <textarea
                  defaultValue={a.internalNotes}
                  onBlur={(e) => e.target.value !== a.internalNotes && updateAccount(a, { internalNotes: e.target.value })}
                  placeholder="Internal notes (saved when you click away)"
                  rows={1}
                  aria-label="Internal notes"
                  className="w-full rounded-xl border border-beige-200 bg-beige-50 p-3 text-xs outline-none focus:border-forest-600"
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-xs text-[#71717a]">Loading…</p>
          ) : quotes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-beige-300 bg-white p-10 text-center text-sm text-[#71717a]">
              No quote requests yet.
            </div>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="space-y-3 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-forest-950">{q.companyName}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${QUOTE_STYLES[q.status]}`}>{q.status}</span>
                    </div>
                    <p className="text-sm text-forest-900">
                      {q.contactName} · <a href={`mailto:${q.email}`} className="underline">{q.email}</a>
                      {q.phone && ` · ${q.phone}`}
                    </p>
                    <p className="text-sm font-semibold text-forest-950">
                      {q.quantity} — {q.products}
                    </p>
                    <p className="text-xs text-[#71717a]">
                      {[q.frequency, q.deliveryLocation && `Deliver to ${q.deliveryLocation}`].filter(Boolean).join(" · ")}
                    </p>
                    {q.message && <p className="text-xs italic text-forest-800">“{q.message}”</p>}
                    <p className="text-[10px] text-[#a1a1aa]">Received {new Date(q.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${q.email}?subject=${encodeURIComponent(`Your ${BRAND.name} quote request`)}`}
                      onClick={() => q.status === "New" && updateQuote(q, { status: "Contacted" })}
                      className="flex items-center gap-1.5 rounded-full bg-forest-900 px-4 py-2 text-xs font-bold text-secondary hover:bg-forest-800"
                    >
                      <Mail size={13} /> Reply
                    </a>
                    <label className="sr-only" htmlFor={`q-status-${q.id}`}>Status</label>
                    <select
                      id={`q-status-${q.id}`}
                      value={q.status}
                      disabled={busyId === q.id}
                      onChange={(e) => updateQuote(q, { status: e.target.value })}
                      className="rounded-full border border-beige-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                    >
                      {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => remove("quote", q.id, q.companyName)}
                      aria-label={`Delete quote from ${q.companyName}`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <textarea
                  defaultValue={q.internalNotes}
                  onBlur={(e) => e.target.value !== q.internalNotes && updateQuote(q, { internalNotes: e.target.value })}
                  placeholder="Internal notes — pricing offered, lead time… (saved when you click away)"
                  rows={1}
                  aria-label="Internal notes"
                  className="w-full rounded-xl border border-beige-200 bg-beige-50 p-3 text-xs outline-none focus:border-forest-600"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
