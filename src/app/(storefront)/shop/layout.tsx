import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/JsonLd";

const DESCRIPTION =
  "Shop Grade A and Grade B vanilla beans, pure vanilla extract, vanilla powder, vanilla caviar and splits. Filter by category, species and price. Shipped across the USA.";

export const metadata: Metadata = {
  title: "Shop Vanilla Beans, Extract, Powder & Caviar",
  description: DESCRIPTION,
  // Category and search filters (?category=, ?search=) all canonicalise to the main shop page.
  alternates: { canonical: "/shop" },
  openGraph: {
    title: `Shop Vanilla | ${BRAND.name}`,
    description: "Whole vanilla beans, extracts, powder, caviar and splits shipped across the United States.",
    url: "/shop",
    // A segment's own openGraph replaces the root one, so restate the default share image.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${BRAND.name}: pure vanilla, from bean to bottle` }],
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd type="CollectionPage" path="/shop" name="Shop all vanilla" description={DESCRIPTION} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }]} />
      {children}
    </>
  );
}
