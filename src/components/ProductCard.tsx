"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Product, productHref } from "@/data/products";
import { useCart } from "@/components/CartContext";
import { ProductImage } from "@/components/ProductImage";
import { formatUSD } from "@/utils/currency";
import { lowestVolumePrice } from "@/lib/pricing";
import { formatSize } from "@/lib/units";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const href = productHref(product);

  const handleAdd = () => {
    const result = addToCart(product);
    if (!result.success) {
      setMessage(result.message || "Unavailable");
      setTimeout(() => setMessage(null), 2500);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const meta = [product.category, formatSize(product.size)].filter(Boolean).join(" · ");
  const bulkPrice = lowestVolumePrice(product);

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-beige-200/70 bg-white p-4 shadow-[0_4px_20px_rgba(25,29,31,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={href}
        className="relative flex aspect-[1.1] w-full items-center justify-center overflow-hidden rounded-2xl bg-white"
      >
        <ProductImage
          src={product.image}
          alt={`${product.name}${product.size ? `, ${formatSize(product.size)}` : ""} — ${product.category}`}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-x-3.5 top-3.5 z-10 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {product.badge && (
              <span className="rounded-full bg-forest-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                {product.badge}
              </span>
            )}
            {!product.inStock && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-900">
                Sold out
              </span>
            )}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-forest-900 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:bg-forest-950 group-hover:text-white">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </Link>

      <div className="flex items-end justify-between gap-3 px-2 pb-1 pt-5">
        <Link href={href} className="group/title min-w-0">
          {meta && (
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-forest-900/75">{meta}</p>
          )}
          <h3 className="mt-0.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-forest-950 transition group-hover/title:text-forest-600">
            {product.name}
          </h3>
          {bulkPrice && (
            <p className="mt-1 text-[11px] font-semibold text-secondary-deep">Bulk from {formatUSD(bulkPrice)} each</p>
          )}
        </Link>

        <div className="flex shrink-0 flex-col items-end">
          {product.compareAtPrice && product.compareAtPrice > product.numericPrice && (
            <span className="text-[11px] text-forest-900/75 line-through">{formatUSD(product.compareAtPrice)}</span>
          )}
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-forest-950">
            {formatUSD(product.numericPrice)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label={`Add ${product.name} to cart`}
            className={`mt-1 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              added ? "text-secondary-deep" : "text-forest-600 hover:text-forest-950"
            }`}
          >
            {added ? "Added ✓" : "+ Add"}
          </button>
        </div>
      </div>

      {message && (
        <p role="alert" className="px-2 pt-1 text-[11px] font-semibold text-red-700">
          {message}
        </p>
      )}
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-beige-200/70 bg-white p-4">
      <div className="aspect-[1.1] rounded-2xl bg-beige-100" />
      <div className="flex items-end justify-between gap-3 px-2 pb-1 pt-5">
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded bg-beige-200" />
          <div className="h-5 w-40 rounded bg-beige-200" />
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="h-4 w-16 rounded bg-beige-200" />
          <div className="h-3 w-10 rounded bg-beige-200" />
        </div>
      </div>
    </div>
  );
}
