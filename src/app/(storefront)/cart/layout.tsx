import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart & Checkout",
  description: "Review your vanilla order and check out. Free US shipping on qualifying orders.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
