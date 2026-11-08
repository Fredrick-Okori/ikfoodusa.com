import { cache } from "react";
import type { Metadata } from "next";
import { getStoreProductsCatalog, findProductBySlug } from "@/lib/products";
import { Product, categoryHref, productHref } from "@/data/products";
import { BRAND } from "@/lib/brand";
import { formatSize } from "@/lib/units";
import ProductDetailClient from "./ProductDetailClient";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getCatalog = cache(async (): Promise<Product[]> => getStoreProductsCatalog());
const getProduct = cache(async (slug: string): Promise<Product | undefined> => findProductBySlug(slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let product: Product | undefined;
  try {
    product = await getProduct(decodeURIComponent(slug || ""));
  } catch (err) {
    console.warn("Failed to fetch product for metadata:", err);
  }

  if (!product) {
    return { title: "Product not found", description: BRAND.description, robots: { index: false, follow: true } };
  }

  // Each product is its own canonical page (the root layout's canonical is the homepage).
  const canonical = productHref(product);

  const title = `${product.name}${product.size ? ` (${formatSize(product.size)})` : ""} — ${product.category}`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} from ${BRAND.name}. Pure vanilla shipped across the USA.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      // Inline (data:) images and videos can't be shared; fall back to the site's default card.
      images:
        product.image && !product.image.startsWith("data:") && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(product.image)
          ? [{ url: product.image, alt: product.name }]
          : [{ url: "/opengraph-image", width: 1200, height: 630, alt: BRAND.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "");

  let product: Product | undefined;
  let related: Product[] = [];

  try {
    product = await getProduct(decodedSlug);
    const catalog = await getCatalog();
    const others = catalog.filter((p) => p.id !== product?.id);
    related = [
      ...others.filter((p) => p.category === product?.category),
      ...others.filter((p) => p.category !== product?.category),
    ].slice(0, 3);
  } catch (e) {
    console.warn("Error loading product page:", e);
  }

  return (
    <>
      {product && (
        <>
          <ProductJsonLd product={product} />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: "/" },
              { name: product.category, url: categoryHref(product.category) },
              { name: product.name, url: `/product/${decodedSlug}` },
            ]}
          />
        </>
      )}
      <ProductDetailClient initialSlug={decodedSlug} initialProduct={product} initialRelatedProducts={related} />
    </>
  );
}
