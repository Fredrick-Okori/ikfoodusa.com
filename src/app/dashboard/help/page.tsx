"use client";

import Link from "next/link";
import { ExternalLink, Database, Layers, PackageCheck, Receipt } from "lucide-react";
import { DEVELOPER_SHARE_PERCENT, STORE_SHARE_PERCENT } from "@/lib/finance";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight">Help</h1>
        <p className="text-xs text-[#71717a] mt-1">How the store dashboard works.</p>
      </div>

      <div className="rounded-3xl border border-beige-200 bg-white p-8 shadow-2xs space-y-6">
        
        <div className="space-y-4">
          <div className="rounded-2xl bg-beige-50 p-5 border border-beige-200 space-y-2">
            <h2 className="text-sm font-bold text-forest-950 flex items-center gap-2">
              <PackageCheck size={16} className="text-forest-700" /> Products
            </h2>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Add vanilla beans, extracts, powder, caviar, splits and more. Set USD selling and cost prices, adjust stock, and hide products from the storefront without deleting them.
            </p>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 underline pt-1"
            >
              Open products <ExternalLink size={13} />
            </Link>
          </div>

          <div className="rounded-2xl bg-beige-50 p-5 border border-beige-200 space-y-2">
            <h2 className="text-sm font-bold text-forest-950 flex items-center gap-2">
              <Receipt size={16} className="text-forest-700" /> Orders &amp; payments
            </h2>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Orders arrive unpaid. Email the customer a payment link or invoice, then mark the order Paid and move it through Processing → Shipped → Delivered. Gross profit on delivered orders is split {DEVELOPER_SHARE_PERCENT}% developer / {STORE_SHARE_PERCENT}% store.
            </p>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 underline pt-1"
            >
              View orders <ExternalLink size={13} />
            </Link>
          </div>

          <div className="rounded-2xl bg-beige-50 p-5 border border-beige-200 space-y-2">
            <h2 className="text-sm font-bold text-forest-950 flex items-center gap-2">
              <Layers size={16} className="text-forest-700" /> Categories
            </h2>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Categories (Grade A Beans, Vanilla Extract, Vanilla Powder…) power the storefront menu and shop filters. Add, rename, reorder or hide them in Categories.
            </p>
            <Link href="/dashboard/categories" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 underline pt-1">
              Manage categories <ExternalLink size={13} />
            </Link>
          </div>

          <div className="rounded-2xl bg-beige-50 p-5 border border-beige-200 space-y-2">
            <h2 className="text-sm font-bold text-forest-950 flex items-center gap-2">
              <Database size={16} className="text-forest-700" /> Supabase PostgreSQL Database
            </h2>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Database schema DDL, RLS security policies, and financial ledger tables are defined in <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-neutral-200">supabase_schema.sql</code>.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
