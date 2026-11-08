import type { MetadataRoute } from "next";
import { getStoreProductsCatalog } from "@/lib/products";
import { productHref } from "@/data/products";
import { POLICY_EFFECTIVE_DATE } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

const BASE_URL = BRAND.url;
const absolute = (path: string) => (path.startsWith("http") ? path : `${BASE_URL}${path}`);

/** When the content of these pages last changed. Bump a date when you edit that page. */
const CONTENT_UPDATED = {
  home: "2026-11-08",
  ourVanilla: "2026-11-08",
  wholesale: "2026-11-08",
};
const policiesUpdated = new Date(POLICY_EFFECTIVE_DATE).toISOString().slice(0, 10);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // The cart is noindex, and /shop?category=… filters canonicalise to /shop, so neither is listed.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: CONTENT_UPDATED.home,
      changeFrequency: "weekly",
      priority: 1,
      images: [absolute("/opengraph-image"), absolute("/image_1024.png")],
    },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${BASE_URL}/our-vanilla`,
      lastModified: CONTENT_UPDATED.ourVanilla,
      changeFrequency: "monthly",
      priority: 0.8,
      images: [
        absolute("/Madagascar_SAVAN_00096_lr-1024x682.webp"),
        absolute("/our-vanilla-cured-bundle.jpg"),
        absolute("/Vanilla-Extract-im1.webp"),
        absolute("/vanilla-powder.webp"),
      ],
    },
    {
      url: `${BASE_URL}/wholesale`,
      lastModified: CONTENT_UPDATED.wholesale,
      changeFrequency: "monthly",
      priority: 0.8,
      images: [absolute("/bulk-powder-20kg-2x10kg-pack.webp")],
    },
    ...["/shipping-returns", "/privacy", "/terms", "/accessibility", "/privacy-choices"].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: policiesUpdated,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getStoreProductsCatalog();
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}${productHref(p)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(p.image && !p.image.startsWith("data:") && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(p.image)
        ? { images: [absolute(p.image)] }
        : {}),
    }));
  } catch (error) {
    console.warn("Failed to generate dynamic product sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes];
}
