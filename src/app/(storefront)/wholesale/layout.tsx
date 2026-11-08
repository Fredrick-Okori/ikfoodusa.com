import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale & Bulk Vanilla for Business",
  description:
    "Trade pricing, volume discounts and bulk or export quotes on vanilla beans, extract, powder and caviar for bakeries, manufacturers and distributors. Apply for an IK Foods USA trade account.",
  alternates: { canonical: "/wholesale" },
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
