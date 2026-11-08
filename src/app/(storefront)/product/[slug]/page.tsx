import { cache } from "react";
import type { Metadata } from "next";
import { getStoreProductsCatalog, findProductBySlug } from "@/lib/products";
import { Product, categoryHref } from "@/data/products";
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
    return { title: "Product not found", description: BRAND.description };
  }

  const title = `${product.name}${product.size ? ` (${formatSize(product.size)})` : ""} — ${product.category}`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} from ${BRAND.name}. Pure vanilla shipped across the USA.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.image.startsWith("data:") ? undefined : [{ url: product.image, alt: product.name }],
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
