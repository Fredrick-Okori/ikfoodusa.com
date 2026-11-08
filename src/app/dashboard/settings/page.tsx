"use client";

import { Info } from "lucide-react";
import { BRAND, brandAddressLine } from "@/lib/brand";
import { DEVELOPER_SHARE_PERCENT } from "@/lib/finance";
import { PAYMENT_METHODS } from "@/lib/orders";
import { PROMO_CODES } from "@/lib/promotions";
import { formatUSD } from "@/utils/currency";

function Row({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:gap-4">
      <dt className="text-xs font-bold text-forest-950">{label}</dt>
      <dd className="text-sm text-forest-900">{value || <span className="text-[#a1a1aa]">Not set</span>}</dd>
      <dd className="font-mono text-[10px] text-[#a1a1aa]">{source}</dd>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Store settings</h1>
        <p className="mt-1 text-xs text-[#71717a]">Current storefront configuration. All prices are in US dollars.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-beige-300 bg-beige-50 p-4 text-xs text-forest-900">
        <Info size={16} className="mt-0.5 shrink-0 text-forest-700" />
        <p>
          These values live in code so they stay consistent between checkout and reporting. Change them in the file shown
          on each row (or the matching environment variable) and redeploy.
        </p>
      </div>

      <section className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
        <h2 className="border-b border-beige-100 pb-2 text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]">Brand &amp; contact</h2>
        <dl className="divide-y divide-beige-100">
          <Row label="Store name" value={BRAND.name} source="lib/brand.ts" />
          <Row label="Legal entity" value={BRAND.legalName} source="lib/brand.ts" />
          <Row label="Registered address" value={brandAddressLine()} source="lib/brand.ts" />
          <Row label="Parent company" value={BRAND.parentCompany} source="lib/brand.ts" />
          <Row label="Site URL" value={BRAND.url} source="NEXT_PUBLIC_SITE_URL" />
          <Row label="Contact email" value={BRAND.email} source="NEXT_PUBLIC_CONTACT_EMAIL" />
          <Row label="Contact phone" value={BRAND.phone} source="NEXT_PUBLIC_CONTACT_PHONE" />
          <Row label="Order number prefix" value={`${BRAND.orderPrefix}-#####`} source="lib/brand.ts" />
        </dl>
      </section>

      <section className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
        <h2 className="border-b border-beige-100 pb-2 text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]">Shipping &amp; checkout</h2>
        <dl className="divide-y divide-beige-100">
          <Row label="Currency" value="USD ($)" source="utils/currency.ts" />
          <Row label="Free shipping from" value={formatUSD(BRAND.freeShippingThreshold)} source="lib/brand.ts" />
          <Row label="Standard shipping" value={formatUSD(BRAND.standardShippingFee)} source="lib/brand.ts" />
          <Row label="Payment options" value={PAYMENT_METHODS.map((m) => m.label).join(", ")} source="lib/orders.ts" />
          <Row
            label="Promo codes"
            value={Object.entries(PROMO_CODES).map(([code, p]) => `${code} (${Math.round(p.rate * 100)}%)`).join(", ")}
            source="lib/promotions.ts"
          />
        </dl>
      </section>

      <section className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs">
        <h2 className="border-b border-beige-100 pb-2 text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]">Settlement</h2>
        <dl className="divide-y divide-beige-100">
          <Row label="Developer profit share" value={`${DEVELOPER_SHARE_PERCENT}% of gross profit on delivered orders`} source="lib/finance.ts" />
        </dl>
      </section>
    </div>
  );
}
