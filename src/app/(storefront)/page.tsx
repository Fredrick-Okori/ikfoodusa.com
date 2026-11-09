"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Hero } from "@/components/Hero";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { categoryHref } from "@/data/products";
import { categoryImage } from "@/lib/catalog";
import { BRAND, PARENT } from "@/lib/brand";
import { FaqJsonLd } from "@/components/JsonLd";
import { emberWords } from "@/lib/emberWords";
import { useCategories, useStoreProducts } from "@/lib/useCatalog";
import { formatUSD } from "@/utils/currency";

const GRADE_GUIDE = [
  {
    form: "Grade A Beans",
    moisture: "30–35%",
    look: "Plump, glossy, supple",
    bestFor: "Scraping seeds into custards, ice cream, crème brûlée, pastry",
  },
  {
    form: "Grade B Beans",
    moisture: "15–25%",
    look: "Drier, firmer, less oily",
    bestFor: "Homemade extract, infusing sugar, spirits and syrups",
  },
  {
    form: "Vanilla Splits",
    moisture: "20–30%",
    look: "Split or cut, imperfect",
    bestFor: "Everyday baking and extract at a lower cost per bean",
  },
  {
    form: "Vanilla Extract",
    moisture: "Liquid",
    look: "Deep amber",
    bestFor: "Cakes, cookies, batters, anywhere a recipe calls for teaspoons",
  },
  {
    form: "Vanilla Powder",
    moisture: "Dry",
    look: "Fine, dark ground bean",
    bestFor: "Heat-stable flavor in dry mixes, coffee, smoothies, rubs",
  },
  {
    form: "Vanilla Caviar",
    moisture: "Paste-like",
    look: "Pure scraped seeds",
    bestFor: "Visible flecks in pastry cream, glazes, panna cotta",
  },
];

const PROCESS = [
  { title: "Hand-pollinated", text: "Every orchid flower, by hand, the morning it opens." },
  { title: "Slow-cured", text: "Blanched, sweated and sun-dried for months." },
  { title: "Graded by hand", text: "Sorted by length, moisture and oil." },
  { title: "Sealed fresh", text: "Packed airtight, so beans arrive supple." },
];

const MARQUEE = ["Grade A beans", "Pure extract", "Ground powder", "Vanilla caviar", "Grade B beans", "Splits"];

const FAQ = [
  {
    q: "Where does your vanilla come from?",
    a: `${BRAND.name} is the US branch of ${PARENT.name}, a vanilla grower and exporter founded in ${PARENT.foundingDate} that works with smallholder farmers in ${PARENT.growingRegion}. We also carry selected vanilla from other origins such as Madagascar. Every product page lists its origin.`,
  },
  {
    q: "How long does shipping take?",
    a: `Orders ship within 1–2 business days. Standard US delivery takes 3–6 business days. Shipping is free on orders over ${formatUSD(BRAND.freeShippingThreshold)}; below that it's a flat ${formatUSD(BRAND.standardShippingFee)}.`,
  },
  {
    q: "How should I store vanilla beans?",
    a: "Keep beans in an airtight glass jar or vacuum-sealed bag in a cool, dark cupboard. Don't refrigerate. It dries the beans and can encourage mold. Stored this way they keep for 1–2 years.",
  },
  {
    q: "How do I pay?",
    a: "Place your order and we'll email a secure card payment link, a PayPal invoice, or Zelle instructions, whichever you choose at checkout. Your order ships once payment clears.",
  },
  {
    q: "Can I return an order?",
    a: `Unopened products can be returned within 30 days. If anything arrives damaged, email ${BRAND.email} with a photo and we'll make it right.`,
  },
];

const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";

export default function Home() {
  const { products, isLoading } = useStoreProducts();
  const { categories } = useCategories();
  const mainRef = useRef<HTMLElement>(null);

  // Retail shoppers first: in-stock, consumer-sized products, badged ones leading, one per category where possible.
  const featured = useMemo(() => {
    const retail = products.filter((p) => p.inStock && p.numericPrice < 100);
    const ranked = [...retail].sort((a, b) => Number(Boolean(b.badge)) - Number(Boolean(a.badge)));
    const picks: typeof products = [];
    for (const p of ranked) if (!picks.some((x) => x.category === p.category)) picks.push(p);
    for (const p of ranked) if (picks.length < 6 && !picks.includes(p)) picks.push(p);
    return picks.slice(0, 6);
  }, [products]);

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return counts;
  }, [products]);

  /* Scroll animations for the static sections. */
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia(main);
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;

      media.add("(prefers-reduced-motion: no-preference)", () => {
        // Headings rise line by line out of a mask.
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const split = SplitText.create(el, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          gsap.fromTo(split.lines, { yPercent: 105 }, {
            yPercent: 0,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 86%" },
          });
        });

        // Marquee: loops on its own, speeds up and flips direction with the scroll.
        const marquee = gsap.to("[data-marquee-track]", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
        // Start deep into the loop so playing it backwards never hits the beginning and stalls.
        marquee.totalTime(marquee.duration() * 1000);
        ScrollTrigger.create({
          trigger: "[data-marquee]",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = Math.min(Math.abs(self.getVelocity()) / 220, 5);
            gsap.to(marquee, { timeScale: self.direction * (1 + boost), duration: 0.4, overwrite: true });
            gsap.to(marquee, { timeScale: self.direction, duration: 1.2, delay: 0.4 });
          },
        });

        // Drawn rules with their row contents following.
        gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: "top 90%" } })
            .fromTo(row.querySelector("[data-rule-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.inOut" })
            .fromTo(
              row.querySelectorAll("[data-rule-text]"),
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" },
              0.3
            );
        });

        // Story statement lights up word by word.
        gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
          const split = SplitText.create(el, { type: "words" });
          emberWords(el, split.words);
        });

        // Process steps light up one after another.
        gsap.fromTo(
          "[data-process-step]",
          { opacity: 0.18 },
          {
            opacity: 1,
            stagger: 0.5,
            ease: "none",
            scrollTrigger: { trigger: "[data-process]", start: "top 80%", end: "bottom 55%", scrub: true },
          }
        );
        gsap.fromTo(
          "[data-process-line]",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: { trigger: "[data-process]", start: "top 80%", end: "bottom 55%", scrub: true } }
        );

        // Images: open from the bottom, then drift inside their frame.
        gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 82%" } }
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((wrap) => {
          const img = wrap.querySelector("img");
          if (!img) return;
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.18 },
            {
              yPercent: 8,
              scale: 1.18,
              ease: "none",
              scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });

        // Wholesale headline slides across as the section passes.
        gsap.fromTo(
          "[data-slide-x]",
          { xPercent: 8 },
          {
            xPercent: -8,
            ease: "none",
            scrollTrigger: { trigger: "[data-wholesale]", start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // Category list: a photo follows the cursor (desktop, mouse only).
      media.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 1024px)", () => {
        const list = main.querySelector<HTMLElement>("[data-cat-list]");
        const preview = main.querySelector<HTMLElement>("[data-cat-preview]");
        const previewImg = preview?.querySelector("img");
        if (!list || !preview || !previewImg) return;

        gsap.set(preview, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.6, rotate: -6 });
        const moveX = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
        const moveY = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });

        const onMove = (event: PointerEvent) => {
          const box = list.getBoundingClientRect();
          moveX(event.clientX - box.left);
          moveY(event.clientY - box.top);
          const row = (event.target as HTMLElement).closest<HTMLElement>("[data-cat-row]");
          if (row?.dataset.image && previewImg.getAttribute("src") !== row.dataset.image) {
            previewImg.src = row.dataset.image;
            gsap.fromTo(previewImg, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: "power3.out" });
          }
        };
        const onEnter = () => gsap.to(preview, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.5, ease: "power3.out" });
        const onLeave = () => gsap.to(preview, { autoAlpha: 0, scale: 0.6, rotate: -6, duration: 0.4, ease: "power3.in" });

        list.addEventListener("pointermove", onMove);
        list.addEventListener("pointerenter", onEnter);
        list.addEventListener("pointerleave", onLeave);
        return () => {
          list.removeEventListener("pointermove", onMove);
          list.removeEventListener("pointerenter", onEnter);
          list.removeEventListener("pointerleave", onLeave);
        };
      });

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, []);

  /* Product cards and category rows arrive after the catalog loads, so they animate separately. */
  useEffect(() => {
    const main = mainRef.current;
    if (!main || isLoading) return;
    const media = gsap.matchMedia(main);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      gsap.set(cards, { autoAlpha: 0, y: 70, rotate: 1.5 });
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.09 }),
      });
      gsap.utils.toArray<HTMLElement>("[data-cat-row]").forEach((row) => {
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 92%" } })
          .fromTo(row.querySelector("[data-rule-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.inOut" })
          .fromTo(row.querySelector("[data-cat-name]"), { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: "expo.out" }, 0.25);
      });
    });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(frame);
      media.revert();
    };
  }, [isLoading, featured.length, categories.length]);

  return (
    <main ref={mainRef} className="overflow-x-clip bg-forest-950 text-beige-50">
      <FaqJsonLd items={FAQ} />
      <Hero />

      {/* MARQUEE */}
      <div data-marquee aria-hidden className="overflow-hidden bg-beige-100 py-5 text-forest-950 sm:py-7">
        <div data-marquee-track className="flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {MARQUEE.map((item) => (
                <span key={item} className="flex items-center">
                  <span className="px-6 text-[clamp(1.75rem,4vw,3.5rem)] font-black leading-none tracking-[-0.04em] sm:px-10">
                    {item}
                  </span>
                  <span className="h-3 w-3 rounded-full bg-forest-950 sm:h-4 sm:w-4" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <section className="bg-beige-50 text-forest-950">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <h2 data-no-reveal data-split className={`${heading} max-w-3xl text-[clamp(2.75rem,7vw,6rem)]`}>
            Picked for <span className="text-forest-600">your kitchen.</span>
          </h2>
          <Link href="/shop" className="shrink-0 border-b-2 border-forest-950 pb-1 text-sm font-extrabold transition hover:border-secondary-deep hover:text-secondary-deep">
            Shop everything
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((product, i) => (
                <div key={product.id} data-card>
                  <ProductCard product={product} priority={i < 3} />
                </div>
              ))}
        </div>
        {!isLoading && featured.length === 0 && (
          <p className="mt-10 text-lg text-forest-900/75">Fresh stock is on its way. Check back soon.</p>
        )}
      </div>
      </section>

      {/* SHOP BY FORM: an index of big names; on desktop a photo follows the cursor */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.75rem,7vw,6rem)]`}>
            Every way to use vanilla.
          </h2>
          <p className="max-w-xs text-base leading-relaxed text-beige-100/65">
            Beans to scrape, extract to measure, powder to bake with. Pick a form.
          </p>
        </div>

        <div data-cat-list className="relative mt-14">
          <div
            data-cat-preview
            aria-hidden
            className="pointer-events-none invisible absolute left-0 top-0 z-20 hidden h-72 w-56 overflow-hidden rounded-2xl bg-forest-900 shadow-2xl lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="h-full w-full object-cover" />
          </div>

          <ul>
            {categories.map((category) => {
              const count = countByCategory.get(category.name) || 0;
              const image = categoryImage(category.slug, products.find((p) => p.category === category.name)?.image);
              return (
                <li key={category.slug}>
                  <Link
                    href={categoryHref(category.name)}
                    data-cat-row
                    data-image={image}
                    className="group relative flex items-center gap-5 py-5 sm:py-7"
                  >
                    <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-beige-50/15" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl bg-white object-cover lg:hidden" />
                    <span className="flex min-w-0 flex-1 items-start overflow-hidden">
                      <span
                        data-cat-name
                        className="block text-[clamp(1.9rem,5.5vw,4.75rem)] font-black leading-[1.02] tracking-[-0.045em] transition-[color,translate] duration-500 group-hover:translate-x-3 group-hover:text-secondary"
                      >
                        {category.name}
                      </span>
                      {!isLoading && count > 0 && (
                        <sup className="ml-2 mt-2 text-xs font-bold text-beige-100/50 sm:text-sm">{count}</sup>
                      )}
                    </span>
                    <span className="hidden max-w-xs text-sm leading-relaxed text-beige-100/55 xl:block">{category.description}</span>
                    <span
                      aria-hidden
                      className="text-2xl font-black text-beige-50/30 transition duration-500 group-hover:translate-x-1 group-hover:text-secondary"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <span className="block h-px bg-beige-50/15" />
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="scroll-mt-32 bg-forest-900 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <p data-scrub-words className="text-[clamp(2rem,4.2vw,3.75rem)] font-black leading-[1.05] tracking-[-0.04em]">
              Nine months on the vine, then months of curing by hand. As the US branch of {PARENT.name}, we buy
              straight from growers who never rush it, so the flavor runs deep: <span data-ember className="text-ember-500">creamy, smoky, floral.</span>
            </p>
            <div data-clip data-parallax className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/image_1024.png"
                alt="Bottles of pure vanilla extract and cured vanilla beans on a linen cloth"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div data-process className="relative mt-20 lg:mt-28">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10">
              <div data-process-line className="h-full w-full origin-left bg-beige-200" />
            </div>
            <ol className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {PROCESS.map((step) => (
                <li key={step.title} data-process-step>
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-beige-50 sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-beige-100/70">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <Link
            href="/our-vanilla"
            className="mt-16 inline-block border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary transition hover:border-beige-50 hover:text-beige-50"
          >
            Follow a bean from garden to kitchen
          </Link>
        </div>
      </section>

      {/* GRADE GUIDE */}
      <section id="guide" className="scroll-mt-32 bg-beige-100 text-forest-950">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.75rem,7vw,6rem)]`}>
            Grade A, Grade B, or something else?
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-forest-900/70">
            Grade is about moisture and looks, not flavor. Pick the form that suits how you cook.
          </p>
        </div>

        <div className="mt-16">
          <div className="hidden grid-cols-[1.3fr_0.6fr_0.9fr_1.4fr] gap-8 pb-4 text-sm font-bold text-forest-900/50 md:grid">
            <span>Form</span>
            <span>Moisture</span>
            <span>Look &amp; feel</span>
            <span>Best for</span>
          </div>
          <ul>
            {GRADE_GUIDE.map((row) => (
              <li key={row.form} data-rule className="relative grid gap-2 py-7 md:grid-cols-[1.3fr_0.6fr_0.9fr_1.4fr] md:items-baseline md:gap-8">
                <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-forest-950/20" />
                <Link
                  href={categoryHref(row.form)}
                  data-rule-text
                  className="text-2xl font-black tracking-[-0.035em] transition-colors hover:text-forest-600 sm:text-3xl"
                >
                  {row.form}
                </Link>
                <span data-rule-text className="text-base font-extrabold text-forest-950">
                  <span className="font-medium text-forest-900/60 md:hidden">Moisture </span>
                  {row.moisture}
                </span>
                <span data-rule-text className="text-base text-forest-900/70">{row.look}</span>
                <span data-rule-text className="text-base text-forest-900/70">{row.bestFor}</span>
              </li>
            ))}
          </ul>
          <span className="block h-px bg-forest-950/20" />
        </div>
      </div>
      </section>

      {/* WHOLESALE */}
      <section id="wholesale" data-wholesale className="scroll-mt-32 overflow-hidden bg-forest-950 text-beige-50">
        <div className="py-20 lg:py-28">
          <p
            data-slide-x
            aria-hidden
            className="whitespace-nowrap text-[clamp(4rem,14vw,13rem)] font-black leading-none tracking-[-0.05em] text-beige-100"
          >
            Buying by the pound? Buying by the pound?
          </p>
          <div className="mx-auto mt-14 grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12">
            <div>
              <h2 data-no-reveal className="sr-only">Buying by the pound?</h2>
              <p className="max-w-xl text-xl leading-relaxed text-beige-100/75 sm:text-2xl">
                Bakeries, ice cream makers, manufacturers and distributors get trade pricing, volume discounts, PO
                numbers and Net-30 invoicing, sourced direct from our parent exporter, IK Food Uganda.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-8">
                <Link
                  href="/wholesale"
                  className="rounded-full bg-secondary px-7 py-4 text-sm font-extrabold text-forest-950 transition hover:bg-secondary-dark"
                >
                  Open a trade account
                </Link>
                <Link
                  href="/wholesale#apply"
                  className="border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary transition hover:border-beige-50 hover:text-beige-50"
                >
                  Request a bulk or export quote
                </Link>
              </div>
            </div>
            <div data-clip className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-beige-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Natural-Vanilla-Vanilla-Extract-Sugar-Free-Range.jpg"
                alt="Vanilla extract in retail bottles and bulk food-service jugs"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SHIPPING & FAQ */}
      <section id="shipping" className="mx-auto max-w-7xl scroll-mt-32 border-t border-beige-50/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.5rem,5.5vw,4.75rem)]`}>
            Good to know before you order.
          </h2>
          <div>
            {FAQ.map((item) => (
              <details key={item.q} data-rule className="group relative [&_summary::-webkit-details-marker]:hidden">
                <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-beige-50/15" />
                <summary
                  data-rule-text
                  className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 text-xl font-extrabold tracking-[-0.02em] transition-colors hover:text-secondary sm:text-2xl"
                >
                  {item.q}
                  <span aria-hidden className="text-3xl font-light leading-none text-secondary transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="-mt-2 max-w-2xl pb-8 text-base leading-relaxed text-beige-100/65">{item.a}</p>
              </details>
            ))}
            <span className="block h-px bg-beige-50/15" />
          </div>
        </div>
      </section>
    </main>
  );
}
