import React from "react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Staff Login",
  description: `Sign in to the ${BRAND.name} store dashboard.`,
  robots: { index: false, follow: false },
};

export default function DashboardLoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full bg-beige-50 font-sans text-forest-950 antialiased">{children}</div>;
}
