import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Afacad_Flux } from "next/font/google";
import { StoreJsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const afacadFlux = Afacad_Flux({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-afacad-flux",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#252a2d",
  width: "device-width",
  initialScale: 1,
  // No maximumScale: blocking pinch-zoom fails WCAG 1.4.4 (Resize Text).
};

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} | Vanilla Beans, Extract, Powder & Caviar`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "vanilla beans",
    "Grade A vanilla beans",
    "Grade B vanilla beans",
    "pure vanilla extract",
    "vanilla powder",
    "vanilla caviar",
    "vanilla bean paste",
    "split vanilla beans",
    "bulk vanilla beans USA",
    "IK Foods USA",
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND.name} | Pure Vanilla, From Bean to Bottle`,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.name,
    images: [{ url: "/product_hero.avif", width: 4032, height: 3024, alt: "IK Food vanilla beans in glass jars" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | Pure Vanilla`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${cormorant.variable} ${plusJakarta.variable} ${afacadFlux.variable}`}
    >
      <head>
        <StoreJsonLd />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
