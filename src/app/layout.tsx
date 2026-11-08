import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Afacad_Flux } from "next/font/google";
import { StoreJsonLd } from "@/components/JsonLd";
import { BRAND, PARENT } from "@/lib/brand";
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

const DESCRIPTION = `Premium vanilla beans, pure vanilla extract, vanilla powder, caviar and splits, shipped across the USA. ${BRAND.name} is the US branch of ${PARENT.name}, the Ugandan vanilla grower and exporter.`;

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} | Premium Vanilla Beans, Extract & Powder`,
    template: `%s | ${BRAND.name}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND.name,
  category: "food",
  keywords: [
    "vanilla beans",
    "Ugandan vanilla beans",
    "Uganda vanilla",
    "Grade A vanilla beans",
    "Grade B vanilla beans",
    "pure vanilla extract",
    "vanilla powder",
    "vanilla caviar",
    "vanilla bean paste",
    "split vanilla beans",
    "bulk vanilla beans USA",
    "wholesale vanilla",
    "IK Foods USA",
    "IK Food Uganda",
  ],
  authors: [{ name: BRAND.name, url: BRAND.url }],
  creator: BRAND.name,
  publisher: BRAND.name,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND.name} | Pure Vanilla, From Bean to Bottle`,
    description: DESCRIPTION,
    url: BRAND.url,
    siteName: BRAND.name,
    locale: "en_US",
    type: "website",
    // Image comes from app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | Pure Vanilla, From Bean to Bottle`,
    description: DESCRIPTION,
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
  other: {
    // Points AI assistants at the plain-text site summary (app/llms.txt/route.ts).
    "llms-txt": `${BRAND.url}/llms.txt`,
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
