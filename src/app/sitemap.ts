import type { MetadataRoute } from "next";
import { getStoreProductsCatalog } from "@/lib/products";
import { slugify } from "@/data/products";

import { BRAND } from "@/lib/brand";

const BASE_URL = BRAND.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cart`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/our-vanilla`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/wholesale`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...["/shipping-returns", "/privacy", "/terms", "/accessibility", "/privacy-choices"].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: currentDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  // Dynamic Product Pages from Database
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbProducts = await getStoreProductsCatalog();

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      productRoutes = dbProducts.map((p) => {
        const productSlug = slugify(p.name) || p.id;
        return {
          url: `${BASE_URL}/product/${productSlug}`,
          lastModified: currentDate,
          changeFrequency: "daily" as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.warn("Failed to generate dynamic product sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes];
}
