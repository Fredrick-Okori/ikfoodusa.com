"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { InvoiceEditor } from "@/components/dashboard/InvoiceEditor";
import { Invoice } from "@/lib/invoices";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invoices?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Invoice not found");
        setInvoice(data.invoice);
        // Opened from the list's print button
        if (new URLSearchParams(window.location.search).get("print") === "1") {
          setTimeout(() => window.print(), 400);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Invoice not found"));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-800">
        <p>{error}</p>
        <Link href="/dashboard/invoices" className="underline">Back to invoices</Link>
      </div>
    );
  }
  if (!invoice) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#71717a]">
        <Loader2 size={16} className="animate-spin" /> Loading invoice…
      </p>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, subtotal, taxAmount, total, balanceDue, createdAt, ...draft } = invoice;
  return <InvoiceEditor key={invoice.id} initial={draft} invoiceId={invoice.id} />;
}
