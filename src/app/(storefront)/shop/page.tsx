"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { useCategories, useStoreProducts } from "@/lib/useCatalog";

type SortOption = "featured" | "price-asc" | "price-desc" | "name";

const PRICE_TIERS = [
  { id: "all", label: "Any price", test: () => true },
  { id: "under-20", label: "Under $20", test: (p: number) => p < 20 },
  { id: "20-50", label: "$20 – $50", test: (p: number) => p >= 20 && p <= 50 },
  { id: "50-100", label: "$50 – $100", test: (p: number) => p > 50 && p <= 100 },
  { id: "over-100", label: "Over $100", test: (p: number) => p > 100 },
];

const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";

/** A filter option drawn as bold text with a lime marker; the real input stays for keyboard and screen readers. */
function Option({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`h-3 w-3 shrink-0 border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-forest-950 peer-focus-visible:ring-offset-2 ${
          type === "radio" ? "rounded-full" : "rounded-[3px]"
        } ${checked ? "border-secondary-deep bg-secondary" : "border-forest-950/25 group-hover:border-forest-950/60"}`}
      />
      <span
        className={`text-base transition-colors ${
          checked ? "font-extrabold text-forest-950" : "font-medium text-forest-900/60 group-hover:text-forest-950"
        }`}
      >
        {children}
      </span>
    </label>
  );
}

function FilterPanel({
  species,
  selectedSpecies,
  toggleSpecies,
  priceTier,
  setPriceTier,
  inStockOnly,
  setInStockOnly,
}: {
  species: string[];
  selectedSpecies: string[];
  toggleSpecies: (s: string) => void;
  priceTier: string;
  setPriceTier: (t: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
}) {
  const legend = "mb-3 text-xl font-black tracking-[-0.03em] text-forest-950";
  return (
    <div className="space-y-8">
      <fieldset className="border-t border-forest-950/15 pt-6">
        <legend className={`${legend} float-left w-full`}>Price</legend>
        <div className="clear-both">
          {PRICE_TIERS.map((tier) => (
            <Option key={tier.id} type="radio" name="priceTier" checked={priceTier === tier.id} onChange={() => setPriceTier(tier.id)}>
              {tier.label}
            </Option>
          ))}
        </div>
      </fieldset>

      {species.length > 0 && (
        <fieldset className="border-t border-forest-950/15 pt-6">
          <legend className={`${legend} float-left w-full`}>Species</legend>
          <div className="clear-both">
            {species.map((name) => (
              <Option key={name} type="checkbox" checked={selectedSpecies.includes(name)} onChange={() => toggleSpecies(name)}>
                {name}
              </Option>
            ))}
          </div>
        </fieldset>
      )}

      <div className="border-t border-forest-950/15 pt-6">
        <Option type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)}>
          In stock only
        </Option>
      </div>
    </div>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "All";
  const searchParam = searchParams.get("search") || "";

  const { products, isLoading, error } = useStoreProducts();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [priceTier, setPriceTier] = useState("all");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // A new ?search= (e.g. from the header search) replaces whatever is typed here.
  const [lastSearchParam, setLastSearchParam] = useState(searchParam);
  if (searchParam !== lastSearchParam) {
    setLastSearchParam(searchParam);
    setSearchQuery(searchParam);
  }

  const setCategory = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === "All") params.delete("category");
    else params.set("category", name);
    router.replace(`/shop${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  const speciesOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.species).filter(Boolean) as string[])).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tier = PRICE_TIERS.find((t) => t.id === priceTier) || PRICE_TIERS[0];
    const result = products.filter((p) => {
      if (categoryParam !== "All" && p.category.toLowerCase() !== categoryParam.toLowerCase()) return false;
      if (inStockOnly && !p.inStock) return false;
      if (selectedSpecies.length > 0 && (!p.species || !selectedSpecies.includes(p.species))) return false;
      if (!tier.test(p.numericPrice)) return false;
      if (q) {
        const haystack = [p.name, p.producer, p.origin, p.category, p.species, p.grade, p.description]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortOption === "price-asc") result.sort((a, b) => a.numericPrice - b.numericPrice);
    else if (sortOption === "price-desc") result.sort((a, b) => b.numericPrice - a.numericPrice);
    else if (sortOption === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else result.sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(Boolean(b.badge)) - Number(Boolean(a.badge)));
    return result;
  }, [products, categoryParam, searchQuery, priceTier, selectedSpecies, inStockOnly, sortOption]);

  const hasFilters =
    categoryParam !== "All" || priceTier !== "all" || selectedSpecies.length > 0 || inStockOnly || searchQuery !== "";

  const clearAllFilters = () => {
    setSearchQuery("");
    setPriceTier("all");
    setSelectedSpecies([]);
    setInStockOnly(false);
    setSortOption("featured");
    router.replace("/shop", { scroll: false });
  };

  const activeCategoryMeta = categories.find((c) => c.name === categoryParam);

  const panel = (
    <FilterPanel
      species={speciesOptions}
      selectedSpecies={selectedSpecies}
      toggleSpecies={(s) =>
        setSelectedSpecies((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
      }
      priceTier={priceTier}
      setPriceTier={setPriceTier}
      inStockOnly={inStockOnly}
      setInStockOnly={setInStockOnly}
    />
  );

  /* ---------- Animations ---------- */
  const rootRef = useRef<HTMLDivElement>(null);

  // Title rises in on load and whenever the category changes; the current tab scrolls into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tab = root.querySelector<HTMLElement>("[data-shop-tab][aria-current=page]");
    const row = tab?.closest("ul");
    if (tab && row && row.scrollWidth > row.clientWidth) {
      const t = tab.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      row.scrollTo({ left: row.scrollLeft + t.left - r.left - (r.width - t.width) / 2, behavior: "smooth" });
    }

    gsap.registerPlugin(SplitText);
    const media = gsap.matchMedia(root);
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const title = root.querySelector("[data-shop-title]");
        if (!title) return;
        gsap.set(title, { autoAlpha: 1 });
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
        gsap.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 });
        gsap.fromTo("[data-shop-in]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.25 });
      });
    });
    return () => {
      cancelled = true;
      media.revert();
    };
  }, [categoryParam]);

  // Cards stagger in on load and every time the result set changes.
  const resultKey = isLoading ? "" : filteredProducts.map((p) => p.id).join(",");
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !resultKey) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(root);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      gsap.set(cards, { autoAlpha: 0, y: 60, rotate: 1.2 });
      ScrollTrigger.batch(cards, {
        start: "top 95%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, rotate: 0, duration: 1, ease: "expo.out", stagger: 0.07 }),
      });
    });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(frame);
      media.revert();
    };
  }, [resultKey]);

  const title = categoryParam === "All" ? "Shop all vanilla" : categoryParam;

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip bg-beige-50 text-forest-950">
      {/* HERO */}
      <section className="bg-forest-950 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-14 lg:pt-24">
          <h1 key={title} data-shop-title className={`${heading} max-w-5xl text-[clamp(3rem,8vw,7.5rem)]`}>
            {title}
            <span className="text-secondary">.</span>
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
            <p data-shop-in className="max-w-xl text-lg leading-relaxed text-beige-100/75 sm:text-xl">
              {activeCategoryMeta?.description ||
                "Whole beans, extracts, powder, caviar and splits. Everything you need to bake with real vanilla."}
            </p>
            <div data-shop-in className="flex items-end gap-6">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beans, extract, origin…"
                aria-label="Search products"
                className="h-14 min-w-0 flex-1 border-0 border-b-2 border-beige-50/25 bg-transparent px-0 text-xl font-bold text-beige-50 outline-none transition-colors placeholder:font-medium placeholder:text-beige-50/35 focus:border-secondary sm:text-2xl"
              />
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="mb-2 shrink-0 border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary lg:hidden"
              >
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <nav aria-label="Categories" className="border-t border-white/10">
          <ul className="mx-auto flex max-w-7xl gap-x-8 overflow-x-auto px-5 [scrollbar-width:none] sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden">
            {["All", ...categories.map((c) => c.name)].map((name) => {
              const current = categoryParam.toLowerCase() === name.toLowerCase();
              return (
                <li key={name} className="shrink-0">
                  <button
                    type="button"
                    data-shop-tab
                    onClick={() => setCategory(name)}
                    aria-current={current ? "page" : undefined}
                    className={`block border-b-4 py-5 text-base font-black tracking-[-0.03em] transition-colors sm:text-lg ${
                      current ? "border-secondary text-beige-50" : "border-transparent text-beige-50/40 hover:text-beige-50"
                    }`}
                  >
                    {name === "All" ? "All products" : name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-baseline justify-between pb-5">
                <span className="text-2xl font-black tracking-[-0.04em]">Filters</span>
                {hasFilters && (
                  <button onClick={clearAllFilters} className="text-sm font-bold text-forest-900/60 underline underline-offset-4 hover:text-forest-950">
                    Reset
                  </button>
                )}
              </div>
              {panel}
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-2xl font-black tracking-[-0.04em]" aria-live="polite">
                {isLoading ? (
                  <span className="text-forest-900/40">Loading…</span>
                ) : (
                  <>
                    {filteredProducts.length}{" "}
                    <span className="text-forest-900/40">{filteredProducts.length === 1 ? "product" : "products"}</span>
                  </>
                )}
              </p>
              <label className="flex items-center gap-3 text-sm font-bold text-forest-900/60">
                Sort by
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="h-10 border-0 border-b-2 border-forest-950/20 bg-transparent pr-6 text-base font-extrabold text-forest-950 outline-none focus:border-forest-950"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name">Name</option>
                </select>
              </label>
            </div>

            {error && (
              <p role="alert" className="mb-8 border-l-4 border-red-600 pl-4 text-base font-semibold text-red-700">
                We couldn&apos;t load products right now. Please refresh in a moment.
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product, i) => (
                  <div key={product.id} data-card>
                    <ProductCard product={product} priority={i < 3} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-t border-forest-950/15 py-16">
                <p className={`${heading} max-w-2xl text-[clamp(2.25rem,4.5vw,3.75rem)]`}>
                  Nothing matches those filters<span className="text-secondary-deep">.</span>
                </p>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-forest-900/70">
                  Try a different category or clear your filters to see everything we have in stock.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-8">
                  <button
                    onClick={clearAllFilters}
                    className="rounded-full bg-forest-950 px-7 py-4 text-sm font-extrabold text-beige-50 transition-colors hover:bg-forest-800"
                  >
                    Clear filters
                  </button>
                  <Link href="/wholesale" className="border-b-2 border-forest-950 pb-1 text-sm font-extrabold transition-colors hover:border-forest-950/40">
                    Looking for bulk? Ask for a quote
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-forest-950/60" aria-label="Close filters" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(24rem,100%)] flex-col bg-beige-50 shadow-2xl">
            <div className="flex items-center justify-between px-6 pb-2 pt-6">
              <span className="text-3xl font-black tracking-[-0.04em]">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters" className="p-2 transition-colors hover:text-forest-600">
                <X size={22} />
              </button>
            </div>
            <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-6">{panel}</div>
            <div className="flex items-center gap-6 border-t border-forest-950/15 p-5">
              <button onClick={clearAllFilters} className="border-b-2 border-forest-950 pb-0.5 text-sm font-extrabold">
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-full bg-forest-950 py-4 text-sm font-extrabold text-beige-50"
              >
                Show {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-forest-950 text-base font-extrabold text-beige-50/60">
          Loading the pantry…
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
