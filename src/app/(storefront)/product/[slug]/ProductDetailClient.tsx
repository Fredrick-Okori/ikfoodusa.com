"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useCart } from "@/components/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Product, categoryHref, getProductBySlug } from "@/data/products";
import { BRAND } from "@/lib/brand";
import { formatUSD } from "@/utils/currency";
import { unitPriceFor } from "@/lib/pricing";
import { formatSize } from "@/lib/units";

interface ProductDetailClientProps {
  initialSlug: string;
  initialProduct?: Product;
  initialRelatedProducts?: Product[];
}

const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";

function pickRelated(product: Product, list: Product[]) {
  const others = list.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category === product.category);
  return [...sameCategory, ...others.filter((p) => p.category !== product.category)].slice(0, 3);
}

export default function ProductDetailClient({
  initialSlug,
  initialProduct,
  initialRelatedProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [related, setRelated] = useState<Product[]>(initialRelatedProducts);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Server rendering covers the common case; refresh client-side to pick up stock changes.
  useEffect(() => {
    let active = true;
    fetch("/api/store-products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        if (!active || !Array.isArray(data)) return;
        const found = getProductBySlug(initialSlug, data);
        if (found) {
          setProduct(found);
          setRelated(pickRelated(found, data));
        }
      })
      .catch((err) => console.warn("Failed to refresh product:", err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialSlug]);

  // Intro + scroll animations, re-run when the product (or its name) changes.
  const rootRef = useRef<HTMLDivElement>(null);
  const productKey = product ? `${product.id}:${product.name}` : "";
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !productKey) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia(root);
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const title = root.querySelector("[data-pdp-title]");
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro.fromTo(
          "[data-pdp-media]",
          { clipPath: "inset(100% 0% 0% 0% round 28px)" },
          { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.5, ease: "expo.inOut" }
        );
        if (title) {
          gsap.set(title, { autoAlpha: 1 });
          const split = SplitText.create(title, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          intro.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0.3);
        }
        intro.fromTo("[data-pdp-in]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.5);

        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const split = SplitText.create(el, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          gsap.fromTo(
            split.lines,
            { yPercent: 105 },
            { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 88%" } }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: "top 92%" } })
            .fromTo(row.querySelector("[data-rule-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "expo.inOut" })
            .fromTo(
              row.querySelectorAll("[data-rule-text]"),
              { autoAlpha: 0, y: 14 },
              { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power3.out" },
              0.25
            );
        });

        const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
        gsap.set(cards, { autoAlpha: 0, y: 70, rotate: 1.5 });
        ScrollTrigger.batch(cards, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.09 }),
        });
      });
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, [productKey, related.length]);

  if (isLoading && !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-beige-50">
        <Loader2 className="animate-spin text-forest-950" size={32} />
        <p className="text-base font-extrabold text-forest-900/60">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[80vh] items-center bg-forest-950 text-beige-50">
        <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <h1 className={`${heading} max-w-4xl text-[clamp(3rem,8vw,7.5rem)]`}>
            Product not found<span className="text-beige-300">.</span>
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-beige-100/75 sm:text-xl">
            This product may have sold out or been renamed. Browse the shop for what&apos;s in stock today.
          </p>
          <Link
            href="/shop"
            className="mt-12 inline-block rounded-full bg-secondary px-8 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.max(1, product.stockQuantity);
  const changeQuantity = (next: number) => {
    if (next > product.stockQuantity) {
      setStockWarning(`Only ${product.stockQuantity} ${product.stockQuantity === 1 ? "unit" : "units"} available.`);
      return;
    }
    setStockWarning(null);
    setQuantity(Math.max(1, Math.min(next, maxQuantity)));
  };

  const add = () => {
    const result = addToCart(product, quantity);
    if (!result.success) {
      setStockWarning(result.message || "This product is unavailable.");
      return false;
    }
    setStockWarning(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!add()) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (add()) router.push("/cart?step=checkout");
  };

  const unit = unitPriceFor(product, quantity);

  const specs = [
    { label: "Size", value: formatSize(product.size) },
    { label: "Grade", value: product.grade },
    { label: "Species", value: product.species },
    { label: "Origin", value: product.origin },
    { label: "Bean length", value: product.beanLength },
    { label: "Moisture", value: product.moisture },
    { label: "Harvest", value: product.harvest },
    { label: "SKU", value: product.sku },
  ].filter((s) => s.value);

  const profile = [
    { label: "Aroma", value: product.profile?.aroma },
    { label: "Flavor", value: product.profile?.flavor },
    { label: "Best uses", value: product.profile?.uses },
    { label: "Storage", value: product.profile?.storage },
  ].filter((p) => p.value);

  const stockLabel = product.inStock
    ? product.stockQuantity <= 10
      ? `Only ${product.stockQuantity} left`
      : "In stock"
    : "Sold out";

  return (
    <div ref={rootRef} className="overflow-x-clip bg-beige-50 pb-28 text-beige-50 lg:pb-0">
      <div className="bg-forest-950 text-beige-50">
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-12 lg:pb-32 lg:pt-12">
        <nav aria-label="Breadcrumb" data-pdp-in className="flex items-center gap-2 text-sm font-semibold text-beige-100/50">
          <Link href="/" className="shrink-0 transition-colors hover:text-secondary">Home</Link>
          <span aria-hidden>/</span>
          <Link href={categoryHref(product.category)} className="shrink-0 whitespace-nowrap transition-colors hover:text-secondary">{product.category}</Link>
          <span aria-hidden>/</span>
          <span className="min-w-0 truncate text-beige-50">{product.name}</span>
        </nav>

        <div className="mt-8 grid grid-cols-1 items-start gap-12 lg:mt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* Image */}
          <div className="lg:sticky lg:top-24">
            <div data-pdp-media className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-white">
              {product.badge && (
                <span className="absolute left-5 top-5 z-10 rounded-full bg-forest-950 px-4 py-1.5 text-sm font-extrabold text-beige-50">
                  {product.badge}
                </span>
              )}
              <ProductImage
                src={product.image}
                alt={`${product.name}${product.size ? `, ${formatSize(product.size)}` : ""}`}
                priority
                fit="contain"
                videoControls
              />
            </div>
            <p data-pdp-in className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-beige-100/60">
              <span>Free US shipping over ${BRAND.freeShippingThreshold}</span>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-beige-300" />
              <span>100% pure vanilla</span>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-beige-300" />
              <span>Sourced from growers</span>
            </p>
          </div>

          {/* Details */}
          <div>
            <Link
              href={categoryHref(product.category)}
              data-pdp-in
              className="inline-block text-base font-extrabold text-beige-300 transition-colors hover:text-secondary"
            >
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ""}
            </Link>
            <h1 key={product.name} data-pdp-title className={`${heading} mt-3 text-[clamp(2.5rem,5.2vw,4.75rem)]`}>
              {product.name}
            </h1>
            {product.producer && <p data-pdp-in className="mt-4 text-base text-beige-100/65">by {product.producer}</p>}

            <div data-pdp-in className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className={`${heading} text-6xl`}>{formatUSD(product.numericPrice)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.numericPrice && (
                <span className="pb-1 text-xl font-bold text-beige-100/40 line-through">{formatUSD(product.compareAtPrice)}</span>
              )}
              {product.size && <span className="pb-1.5 text-base text-beige-100/60">/ {formatSize(product.size)}</span>}
            </div>
            <p data-pdp-in className="mt-3 flex items-center gap-2 text-base font-extrabold">
              <span
                aria-hidden
                className={`h-2.5 w-2.5 rounded-full ${product.inStock ? (product.stockQuantity <= 10 ? "bg-amber-500" : "bg-secondary") : "bg-red-500"}`}
              />
              <span className={product.inStock ? "text-beige-50" : "text-red-400"}>{stockLabel}</span>
            </p>

            {product.description && (
              <p data-pdp-in className="mt-8 whitespace-pre-line text-lg leading-relaxed text-beige-100/75">
                {product.description}
              </p>
            )}

            {product.priceTiers?.length > 0 && (
              <div data-pdp-in className="mt-10">
                <p className="text-sm font-bold text-beige-100/60">Volume pricing</p>
                <table className="mt-3 w-full text-base">
                  <tbody>
                    {[{ minQty: 1, price: product.numericPrice }, ...product.priceTiers].map((tier, i, all) => {
                      const next = all[i + 1];
                      const active = quantity >= tier.minQty && (!next || quantity < next.minQty);
                      return (
                        <tr
                          key={tier.minQty}
                          className={`border-t border-beige-50/15 ${active ? "font-extrabold text-beige-50" : "text-beige-100/60"}`}
                        >
                          <td className={`py-3 ${active ? "border-l-4 border-l-secondary pl-3" : "pl-4"}`}>
                            {next ? `${tier.minQty}–${next.minQty - 1}` : `${tier.minQty}+`} units
                          </td>
                          <td className="py-3 text-right tabular-nums">{formatUSD(tier.price)} each</td>
                          <td className="w-28 py-3 text-right text-sm text-beige-300">{active && "Your price"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <span className="block h-px bg-beige-50/15" />
              </div>
            )}

            {/* Purchase */}
            <div data-pdp-in className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex h-14 items-center gap-1 border-b-2 border-beige-50/20">
                <button
                  onClick={() => changeQuantity(quantity - 1)}
                  aria-label="Decrease quantity"
                  className="flex h-11 w-11 items-center justify-center transition-colors hover:text-secondary"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-2xl font-black tabular-nums" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => changeQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex h-11 w-11 items-center justify-center transition-colors hover:text-secondary"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex h-14 items-center justify-center rounded-full border-2 px-7 text-sm font-extrabold transition-colors disabled:opacity-40 ${
                  added
                    ? "border-secondary bg-secondary text-forest-950"
                    : "border-beige-50 text-beige-50 hover:bg-beige-50 hover:text-forest-950"
                }`}
              >
                {added ? "Added to cart" : "Add to cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex h-14 min-w-[180px] flex-1 items-center justify-center rounded-full bg-secondary px-7 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark disabled:opacity-40"
              >
                {product.inStock ? "Buy now" : "Sold out"}
              </button>
            </div>
            {stockWarning && (
              <p role="alert" className="mt-4 border-l-4 border-red-600 pl-4 text-sm font-semibold text-red-300">{stockWarning}</p>
            )}
            <p data-pdp-in className="mt-5 text-base text-beige-100/65">
              {quantity > 1 && (
                <>
                  {quantity} × {formatUSD(unit.price)} ={" "}
                  <strong className="font-extrabold text-beige-50">{formatUSD(unit.price * quantity)}</strong>
                  {" · "}
                </>
              )}
              Buying for a business?{" "}
              <Link href="/wholesale" className="border-b-2 border-secondary pb-0.5 font-extrabold text-secondary transition-colors hover:border-beige-50 hover:text-beige-50">
                Trade pricing &amp; bulk quotes
              </Link>
            </p>

            {specs.length > 0 && (
              <div className="mt-16">
                <h2 data-no-reveal className={`${heading} text-4xl`}>Specifications</h2>
                <dl className="mt-6">
                  {specs.map((spec) => (
                    <div key={spec.label} data-rule className="relative flex items-baseline justify-between gap-6 py-4">
                      <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-beige-50/15" />
                      <dt data-rule-text className="text-base text-beige-100/60">{spec.label}</dt>
                      <dd data-rule-text className="text-right text-base font-extrabold">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <span className="block h-px bg-beige-50/15" />
              </div>
            )}
          </div>
        </div>
      </main>
      </div>

      {profile.length > 0 && (
        <section className="border-t border-beige-50/10 bg-forest-900 text-beige-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12 lg:py-32">
            <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.5rem,4.6vw,4.25rem)]`}>
              How it tastes &amp; how to use <span className="whitespace-nowrap">it<span className="text-beige-300">.</span></span>
            </h2>
            <dl>
              {profile.map((item) => (
                <div key={item.label} data-rule className="relative grid gap-2 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-white/15" />
                  <dt data-rule-text className="text-lg font-extrabold text-beige-300">{item.label}</dt>
                  <dd data-rule-text className="text-xl leading-relaxed text-beige-100/85 sm:text-2xl">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className={`mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12 lg:pb-36 pt-24 lg:pt-32`}>
          <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.75rem,6vw,5.25rem)]`}>
              You might also like<span className="text-beige-400">.</span>
            </h2>
            <Link href="/shop" className="shrink-0 border-b-2 border-forest-950 pb-1 text-sm font-extrabold transition-colors hover:border-forest-950/40">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {related.map((p) => (
              <div key={p.id} data-card>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-beige-50/10 bg-forest-950/95 p-3 text-beige-50 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-xs font-bold text-beige-100/60">
              Total · {quantity} {quantity === 1 ? "item" : "items"}
            </span>
            <span className="block text-2xl font-black tracking-[-0.04em]">{formatUSD(unit.price * quantity)}</span>
          </div>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!product.inStock}
            className="rounded-full bg-secondary px-6 py-3.5 text-sm font-extrabold text-forest-950 disabled:opacity-40 transition-colors hover:bg-secondary-dark"
          >
            {product.inStock ? "Buy now" : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
