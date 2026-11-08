import { SiteChrome } from "@/components/SiteChrome";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}