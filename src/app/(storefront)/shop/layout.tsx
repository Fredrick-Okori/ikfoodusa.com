import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Vanilla Beans, Extract, Powder & Caviar",
  description:
    "Shop Grade A and Grade B vanilla beans, pure vanilla extract, vanilla powder, vanilla caviar and splits. Filter by category, species and price. Shipped across the USA.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Shop Vanilla | IK Foods USA",
    description: "Whole vanilla beans, extracts, powder, caviar and splits shipped across the United States.",
    url: "/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
