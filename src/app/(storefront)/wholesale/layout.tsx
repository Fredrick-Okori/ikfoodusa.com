import type { Metadata } from "next";
import { BRAND, PARENT } from "@/lib/brand";
import { BreadcrumbJsonLd, WholesaleServiceJsonLd } from "@/components/JsonLd";

const DESCRIPTION = `Trade pricing, volume discounts, Net-30 invoicing and bulk or export quotes on vanilla beans, extract, powder and caviar for bakeries, manufacturers and distributors, direct from ${PARENT.name}. Apply for an ${BRAND.name} trade account.`;

export const metadata: Metadata = {
  title: "Wholesale & Bulk Vanilla for Business",
  description: DESCRIPTION,
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: `Wholesale & Bulk Vanilla | ${BRAND.name}`,
    description: DESCRIPTION,
    url: "/wholesale",
    images: [{ url: "/bulk-powder-20kg-2x10kg-pack.webp", alt: "Bulk vanilla powder in two 10 kg bags" }],
  },
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WholesaleServiceJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Wholesale & trade", url: "/wholesale" }]} />
      {children}
    </>
  );
}
