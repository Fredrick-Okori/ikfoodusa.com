"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Loader2, Plus, Printer, Save, Trash2, X } from "lucide-react";
import {
  INVOICE_ISSUERS,
  INVOICE_STATUSES,
  Invoice,
  InvoiceDraft,
  InvoiceItem,
  InvoiceStatus,
  PAYMENT_TERM_OPTIONS,
  computeInvoiceTotals,
  formatMoney,
  lineAmount,
} from "@/lib/invoices";

// Boxes look like form fields on screen and like plain text when printed.
const box =
  "w-full rounded-lg border border-[#d4d4d8] bg-white px-3 py-2 text-sm text-forest-950 outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 print:border-transparent print:p-0 print:shadow-none";
const area = `${box} resize-none [field-sizing:content] min-h-[2.5rem]`;
const fieldLabel = "text-sm text-[#52525b]";
/** Shown only when printing, in place of an input. */
const printOnly = "hidden print:block";
const printDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export function InvoiceEditor({
  initial,
  invoiceId,
}: {
  initial: InvoiceDraft;
  /** Present when editing an existing invoice */
  invoiceId?: string;
}) {
  const router = useRouter();
  const [inv, setInv] = useState<InvoiceDraft>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(initial.discount > 0);
  const [showShipping, setShowShipping] = useState(initial.shipping > 0);

  const totals = useMemo(() => computeInvoiceTotals(inv), [inv]);
  const money = (n: number) => formatMoney(n, inv.currency);

  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    setInv((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };
  const setItem = (index: number, patch: Partial<InvoiceItem>) =>
    set("items", inv.items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const applyIssuer = (id: string) => {
    const preset = INVOICE_ISSUERS.find((p) => p.id === id);
    if (!preset) return;
    setInv((prev) => ({
      ...prev,
      issuer: preset.issuer,
      paymentDetails: preset.paymentDetails || prev.paymentDetails,
    }));
  };

  const save = async (): Promise<Invoice | null> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(invoiceId ? `/api/invoices?id=${encodeURIComponent(invoiceId)}` : "/api/invoices", {
        method: invoiceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const message = String(data.error || "Could not save invoice");
        throw new Error(
          message.includes("schema cache") || message.includes("does not exist")
            ? "The invoices table is missing. Run supabase/migrations/003_invoices.sql in Supabase."
            : message
        );
      }
      const saved: Invoice = data.invoice;
      setInv((prev) => ({ ...prev, invoiceNumber: saved.invoiceNumber, status: saved.status }));
      setSavedAt(new Date().toLocaleTimeString("en-US", { timeStyle: "short" }));
      if (!invoiceId) router.replace(`/dashboard/invoices/${saved.id}`);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save invoice");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!invoiceId || !window.confirm(`Delete invoice ${inv.invoiceNumber}? This can't be undone.`)) return;
    const res = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/invoices");
    else setError("Could not delete invoice");
  };

  const duplicate = () => {
    const copy = encodeURIComponent(JSON.stringify({ ...inv, invoiceNumber: "", status: "Draft", amountPaid: 0, orderId: null }));
    router.push(`/dashboard/invoices/new?copy=${copy}`);
  };

  const printInvoice = async () => {
    if (!invoiceId || savedAt === null) {
      const saved = await save();
      if (!saved && !invoiceId) return;
    }
    // Let the browser's print dialog offer "Save as PDF".
    const previousTitle = document.title;
    document.title = `Invoice ${inv.invoiceNumber || ""}`.trim().replace(/\//g, "-");
    window.print();
    document.title = previousTitle;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-16 print:max-w-none print:pb-0">
      {/* Toolbar — hidden when printing */}
      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-xs font-bold text-[#71717a] hover:text-forest-950">
          <ArrowLeft size={16} /> All invoices
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="inv-issuer">Issuing company</label>
          <select
            id="inv-issuer"
            defaultValue=""
            onChange={(e) => {
              applyIssuer(e.target.value);
              e.target.value = "";
            }}
            className="rounded-full border border-beige-200 bg-white px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="" disabled>Issue from…</option>
            {INVOICE_ISSUERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="inv-status">Status</label>
          <select
            id="inv-status"
            value={inv.status}
            onChange={(e) => set("status", e.target.value as InvoiceStatus)}
            className="rounded-full border border-beige-200 bg-white px-3 py-2 text-xs font-bold outline-none"
          >
            {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {invoiceId && (
            <>
              <button onClick={duplicate} className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-bold hover:bg-beige-50">
                <Copy size={13} /> Duplicate
              </button>
              <button onClick={remove} className="flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
          <button onClick={printInvoice} disabled={isSaving} className="flex items-center gap-1.5 rounded-full border border-forest-900 bg-white px-4 py-2 text-xs font-bold text-forest-900 hover:bg-beige-50 disabled:opacity-50">
            <Printer size={13} /> Print / PDF
          </button>
          <button onClick={save} disabled={isSaving} className="flex items-center gap-1.5 rounded-full bg-secondary px-5 py-2 text-xs font-bold text-forest-950 hover:bg-secondary-dark disabled:opacity-50">
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {invoiceId ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </div>

      {(error || savedAt) && (
        <div className="print:hidden">
          {error ? (
            <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
              {error}
              <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
            </div>
          ) : (
            <p className="text-xs font-semibold text-emerald-700">Saved at {savedAt}</p>
          )}
        </div>
      )}

      {/* The invoice document */}
      <article
        id="invoice-document"
        className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_clean.webp" alt="IK Food Ltd" className="h-20 w-auto object-contain object-left sm:h-24" />
          <div className="space-y-3 sm:text-right">
            <h1 className="font-sans text-5xl font-black tracking-tight text-forest-950">INVOICE</h1>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-[#71717a]">#</span>
              <input
                aria-label="Invoice number"
                value={inv.invoiceNumber}
                onChange={(e) => set("invoiceNumber", e.target.value)}
                placeholder="Assigned on save"
                className={`${box} max-w-[220px] text-right font-semibold`}
              />
            </div>
            {inv.status !== "Draft" && (
              <span className="inline-block rounded-full bg-forest-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary print:bg-transparent print:p-0 print:text-forest-950">
                {inv.status}
              </span>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] print:mt-6 print:grid-cols-[1.3fr_1fr] print:gap-6">
          <div className="space-y-6 print:space-y-4">
            <div>
              <label htmlFor="inv-from" className={`${fieldLabel} print:hidden`}>From</label>
              <textarea id="inv-from" value={inv.issuer} onChange={(e) => set("issuer", e.target.value)} className={`${area} mt-1.5`} />
            </div>
            <div className={`grid gap-4 sm:grid-cols-2 ${inv.shipTo ? "print:grid-cols-2" : "print:grid-cols-1"}`}>
              <div>
                <label htmlFor="inv-billto" className={fieldLabel}>Invoice To</label>
                <textarea
                  id="inv-billto"
                  value={inv.billTo}
                  onChange={(e) => set("billTo", e.target.value)}
                  placeholder={"Company name\nAddress\nPhone"}
                  className={`${area} mt-1.5 min-h-[6rem] print:min-h-0`}
                />
              </div>
              <div className={inv.shipTo ? "" : "print:hidden"}>
                <label htmlFor="inv-shipto" className={fieldLabel}>Ship To</label>
                <textarea
                  id="inv-shipto"
                  value={inv.shipTo}
                  onChange={(e) => set("shipTo", e.target.value)}
                  placeholder="(optional)"
                  className={`${area} mt-1.5 min-h-[6rem] ${inv.shipTo ? "" : "print:hidden"}`}
                />
              </div>
            </div>
            <div className="print:hidden">
              <label htmlFor="inv-email" className={fieldLabel}>Customer email (not printed)</label>
              <input id="inv-email" type="email" value={inv.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} className={`${box} mt-1.5`} />
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 self-start">
            <dt className={fieldLabel}><label htmlFor="inv-date">Date</label></dt>
            <dd className="text-right">
              <input id="inv-date" type="date" value={inv.issueDate} onChange={(e) => set("issueDate", e.target.value)} className={`${box} text-right print:hidden`} />
              <span className={`${printOnly} text-sm`}>{printDate(inv.issueDate)}</span>
            </dd>
            <dt className={fieldLabel}><label htmlFor="inv-terms">Payment Terms</label></dt>
            <dd>
              <input id="inv-terms" list="inv-terms-list" value={inv.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} className={`${box} text-right print:hidden`} />
              <span className={`${printOnly} text-right text-sm`}>{inv.paymentTerms}</span>
              <datalist id="inv-terms-list">{PAYMENT_TERM_OPTIONS.map((t) => <option key={t} value={t} />)}</datalist>
            </dd>
            <dt className={fieldLabel}><label htmlFor="inv-due">Due Date</label></dt>
            <dd className="text-right">
              <input id="inv-due" type="date" value={inv.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={`${box} text-right print:hidden`} />
              <span className={`${printOnly} text-sm`}>{printDate(inv.dueDate)}</span>
            </dd>
            <dt className={`${fieldLabel} ${inv.poNumber ? "" : "print:hidden"}`}><label htmlFor="inv-po">PO Number</label></dt>
            <dd className={inv.poNumber ? "" : "print:hidden"}>
              <input id="inv-po" value={inv.poNumber} onChange={(e) => set("poNumber", e.target.value)} placeholder="(optional)" className={`${box} text-right print:hidden`} />
              <span className={`${printOnly} text-right text-sm`}>{inv.poNumber}</span>
            </dd>
            <dt className={`${fieldLabel} print:hidden`}><label htmlFor="inv-currency">Currency</label></dt>
            <dd className="print:hidden">
              <select id="inv-currency" value={inv.currency} onChange={(e) => set("currency", e.target.value)} className={`${box} text-right`}>
                <option value="USD">USD — US dollar</option>
                <option value="UGX">UGX — Ugandan shilling</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British pound</option>
              </select>
            </dd>
          </dl>
        </div>

        {/* Line items */}
        <div className="mt-10 print:mt-6">
          <div className="grid grid-cols-[1fr_110px_130px_130px_32px] items-center gap-2 rounded-xl bg-forest-950 px-4 py-3 text-sm font-bold text-white print:rounded-none print:bg-forest-950 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
            <span>Vanilla Product</span>
            <input
              aria-label="Quantity column label"
              value={inv.quantityLabel}
              onChange={(e) => set("quantityLabel", e.target.value)}
              className="w-full bg-transparent text-right font-bold text-white outline-none"
            />
            <span className="text-right">Rate ({inv.currency})</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          <div className="divide-y divide-beige-100">
            {inv.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_130px_130px_32px] items-center gap-2 py-2">
                <div>
                  <input
                    aria-label={`Item ${i + 1} description`}
                    value={item.description}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                    placeholder="e.g. Dry vanilla split beans, 17% moisture"
                    className={`${box} print:hidden`}
                  />
                  <span className={`${printOnly} text-sm`}>{item.description}</span>
                </div>
                <div className="text-right">
                <span className={`${printOnly} text-sm tabular-nums`}>{item.quantity}</span>
                <input
                  aria-label={`Item ${i + 1} quantity`}
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`${box} text-right print:hidden`}
                />
                </div>
                <div className="text-right">
                <span className={`${printOnly} text-sm tabular-nums`}>{money(Number(item.rate) || 0)}</span>
                <input
                  aria-label={`Item ${i + 1} rate`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => setItem(i, { rate: Number(e.target.value) })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`${box} text-right print:hidden`}
                />
                </div>
                <span className="text-right text-sm font-semibold tabular-nums">{money(lineAmount(item))}</span>
                <button
                  onClick={() => set("items", inv.items.filter((_, j) => j !== i))}
                  disabled={inv.items.length === 1}
                  aria-label={`Remove item ${i + 1}`}
                  className="rounded-full p-1.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 disabled:opacity-30 print:hidden"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => set("items", [...inv.items, { description: "", quantity: 1, rate: 0 }])}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e4e4e7] py-3 text-sm font-semibold text-forest-950 hover:bg-[#d4d4d8] print:hidden"
          >
            <Plus size={16} /> Line Item
          </button>
        </div>

        {/* Details + totals */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] print:mt-6 print:grid-cols-2 print:gap-8">
          <div className="space-y-6 print:space-y-4">
            <div className={inv.paymentDetails ? "" : "print:hidden"}>
              <label htmlFor="inv-payment" className={fieldLabel}>Payment Details</label>
              <textarea
                id="inv-payment"
                value={inv.paymentDetails}
                onChange={(e) => set("paymentDetails", e.target.value)}
                placeholder={"Bank name, account name and number, routing / SWIFT…"}
                className={`${area} mt-1.5 min-h-[7rem] print:min-h-0`}
              />
            </div>
            <div className={inv.deliveryDetails ? "" : "print:hidden"}>
              <label htmlFor="inv-delivery" className={fieldLabel}>Delivery Details</label>
              <textarea
                id="inv-delivery"
                value={inv.deliveryDetails}
                onChange={(e) => set("deliveryDetails", e.target.value)}
                placeholder="Incoterm, shipping method, expected delivery date…"
                className={`${area} mt-1.5`}
              />
            </div>
            <div className={inv.notes ? "" : "print:hidden"}>
              <label htmlFor="inv-notes" className={fieldLabel}>Notes</label>
              <textarea id="inv-notes" value={inv.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Thank you for your business." className={`${area} mt-1.5`} />
            </div>
          </div>

          <dl className="space-y-3 self-start text-sm">
            <div className="flex items-center justify-between">
              <dt className={fieldLabel}>Subtotal</dt>
              <dd className="tabular-nums">{money(totals.subtotal)}</dd>
            </div>
            {showDiscount && (
              <div className="flex items-center justify-between gap-4">
                <dt className={fieldLabel}><label htmlFor="inv-discount">Discount</label></dt>
                <dd className="flex items-center gap-2">
                  <input id="inv-discount" type="number" min="0" step="0.01" value={inv.discount} onChange={(e) => set("discount", Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`${box} w-32 text-right print:hidden`} />
                  <span className={`${printOnly} tabular-nums`}>−{money(totals.discount)}</span>
                  <button onClick={() => { set("discount", 0); setShowDiscount(false); }} aria-label="Remove discount" className="text-[#a1a1aa] hover:text-red-600 print:hidden"><X size={14} /></button>
                </dd>
              </div>
            )}
            <div className={`flex items-center justify-between gap-4 ${inv.taxRate ? "" : "print:hidden"}`}>
              <dt className={fieldLabel}><label htmlFor="inv-tax">Tax (%)</label></dt>
              <dd className="flex items-center gap-3">
                <span className="hidden tabular-nums text-[#71717a] print:inline">{inv.taxRate}%</span>
                <input id="inv-tax" type="number" min="0" step="0.01" value={inv.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`${box} w-24 text-right print:hidden`} />
                <span className="w-28 text-right tabular-nums">{money(totals.taxAmount)}</span>
              </dd>
            </div>
            {showShipping && (
              <div className="flex items-center justify-between gap-4">
                <dt className={fieldLabel}><label htmlFor="inv-shipping">Shipping</label></dt>
                <dd className="flex items-center gap-2">
                  <input id="inv-shipping" type="number" min="0" step="0.01" value={inv.shipping} onChange={(e) => set("shipping", Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`${box} w-32 text-right print:hidden`} />
                  <span className={`${printOnly} tabular-nums`}>{money(inv.shipping)}</span>
                  <button onClick={() => { set("shipping", 0); setShowShipping(false); }} aria-label="Remove shipping" className="text-[#a1a1aa] hover:text-red-600 print:hidden"><X size={14} /></button>
                </dd>
              </div>
            )}
            {(!showDiscount || !showShipping) && (
              <div className="flex gap-4 print:hidden">
                {!showDiscount && (
                  <button onClick={() => setShowDiscount(true)} className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                    <Plus size={14} /> Discount
                  </button>
                )}
                {!showShipping && (
                  <button onClick={() => setShowShipping(true)} className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                    <Plus size={14} /> Shipping
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t-2 border-beige-200 pt-4 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(totals.total)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className={fieldLabel}><label htmlFor="inv-paid">Amount Paid</label></dt>
              <dd>
                <input id="inv-paid" type="number" min="0" step="0.01" value={inv.amountPaid} onChange={(e) => set("amountPaid", Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className={`${box} w-36 text-right print:hidden`} />
                <span className={`${printOnly} tabular-nums`}>{money(inv.amountPaid)}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-beige-200 pt-4 text-xl font-black">
              <dt>Balance Due</dt>
              <dd className="tabular-nums">{money(totals.balanceDue)}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  );
}
