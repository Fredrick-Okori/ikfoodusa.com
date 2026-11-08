"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { categoryHref } from "@/data/products";
import { BRAND, PARENT } from "@/lib/brand";

/** Pod colour at each curing step: fresh green → dulled → brown → dark → near-black. */
const POD_COLORS = ["#7f9d3c", "#6d7a34", "#7a4b26", "#4c2f19", "#2a1a10"];
/** Section background warms from charcoal to cocoa as the beans cure. */
const CURING_BG = ["#191d1f", "#1b1d1a", "#1f1914", "#1e1610", "#1a120c"];

const CURING_STEPS = [
  {
    title: "Killing",
    time: "two or three minutes",
    text: "The green pods are dipped in water at around 65 °C. That stops the bean from growing and starts the enzymes that will, over the coming months, make vanillin.",
  },
  {
    title: "Sweating",
    time: "seven to ten days",
    text: "By day the beans lie out in the sun. By night they are rolled into wool blankets and shut in wooden boxes to sweat. Day after day they go from green to chocolate brown.",
  },
  {
    title: "Drying",
    time: "four to eight weeks",
    text: "On shaded racks the beans lose water slowly. They are felt one at a time, every day, until each one is supple enough for its grade.",
  },
  {
    title: "Conditioning",
    time: "one to three months",
    text: "Closed in boxes, the beans rest. Nothing is added. The creamy, smoky, floral notes deepen on their own, and the beans start to glisten.",
  },
];

const GRADING = [
  ["Length", "Beans are measured and bundled with beans of the same length."],
  ["Moisture", "Plump, oily beans become Grade A. Drier ones become Grade B, the extract maker's bean."],
  ["Feel", "Each bean is bent between the fingers and checked for splits, shine and scent."],
  ["Sealing", "Beans are vacuum-sealed and powder goes into lined food-grade sacks, so nothing dries out on the way."],
];

const FINISHED = [
  {
    name: "Whole beans",
    category: "Grade A Beans",
    image: "/our-vanilla-cured-bundle.jpg",
    alt: "A bundle of cured, glossy dark vanilla beans tied with twine",
    text: "Split one, scrape the seeds into custard or ice cream, then bury the pod in a jar of sugar.",
  },
  {
    name: "Pure extract",
    category: "Vanilla Extract",
    image: "/Vanilla-Extract-im1.webp",
    alt: "A corked bottle and small dish of amber vanilla extract beside cured vanilla beans",
    text: "Chopped beans steeped slowly in alcohol and water for months, until it runs deep amber.",
  },
  {
    name: "Ground powder",
    category: "Vanilla Powder",
    image: "/vanilla-powder.webp",
    alt: "A mound of ground vanilla powder with whole vanilla beans and a bottle of extract",
    text: "Whole dried beans milled fine, with nothing added. It keeps its flavor in a hot oven.",
  },
];

const GARDEN_TIMELINE = [
  ["Year one", "A cutting is tied to a shade tree"],
  ["Year three", "The vine flowers for the first time"],
  ["One morning", "Each flower is pollinated by hand"],
  ["Nine months on", "The pod is picked, still green"],
];

function VanillaPod({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 640" className={className} aria-hidden>
      <path d="M72 8 C 69 20, 68 30, 70 42" stroke="#5c6b2c" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path
        data-pod
        fill={POD_COLORS[0]}
        d="M70 40 C 85 120, 89 260, 87 380 C 85 480, 79 560, 68 614 C 66 621, 61 621, 61 612 C 61 560, 61 480, 60 380 C 58 260, 57 130, 70 40 Z"
      />
      {/* Sheen along one side */}
      <path
        data-pod-sheen
        d="M73 110 C 77 220, 79 320, 78 420 C 77 500, 73 560, 69 598"
        stroke="#ffffff"
        strokeOpacity="0.3"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Fine wrinkles that appear as the bean dries */}
      <g data-pod-wrinkles opacity="0" stroke="#000" strokeOpacity="0.4" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M79 140 C 81 220, 82 300, 81 360" />
        <path d="M67 220 C 65 300, 65 380, 67 460" />
        <path d="M81 400 C 80 460, 77 520, 73 570" />
        <path d="M64 300 C 63 360, 64 420, 65 480" />
      </g>
    </svg>
  );
}

export function OurVanillaStory() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const media = gsap.matchMedia(root);
    let cancelled = false;

    // Wait for the web fonts so text is split at its real line breaks.
    document.fonts.ready.then(() => {
      if (cancelled) return;

      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          wide: "(min-width: 1024px)",
        },
        (context) => {
          const { motion, wide } = context.conditions as { motion: boolean; wide: boolean };
          if (!motion) return;
          root.dataset.animated = "true";

          /* ---------- Hero ---------- */
          gsap.set("[data-hero-title]", { autoAlpha: 1 });
          const heroTitle = SplitText.create("[data-hero-title]", { type: "lines", mask: "lines" });
          gsap.set(heroTitle.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .fromTo(
              "[data-hero-media]",
              { clipPath: "inset(18% 22% 18% 22% round 32px)" },
              { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.8, ease: "expo.inOut" }
            )
            .from("[data-hero-media] img", { scale: 1.35, duration: 2.2 }, 0)
            .from(heroTitle.lines, { yPercent: 110, duration: 1.4, stagger: 0.12 }, 1.35)
            .from("[data-hero-foot]", { autoAlpha: 0, y: 20, duration: 1 }, 1.8);

          gsap.to("[data-hero-media] img", {
            yPercent: 18,
            ease: "none",
            scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
          });
          gsap.to("[data-hero-copy]", {
            yPercent: -40,
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "70% top", scrub: true },
          });

          /* ---------- Section headings: masked line reveals ---------- */
          gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
            const split = SplitText.create(el, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
            gsap.from(split.lines, {
              yPercent: 105,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: "top 85%" },
            });
          });

          /* ---------- Garden: words light up as you read ---------- */
          gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
            const split = SplitText.create(el, { type: "words" });
            gsap.fromTo(
              split.words,
              { opacity: 0.14 },
              {
                opacity: 1,
                ease: "none",
                stagger: 0.08,
                scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
              }
            );
          });

          gsap.fromTo(
            "[data-flower]",
            { rotate: -24, scale: 0.8 },
            {
              rotate: 12,
              scale: 1.05,
              ease: "none",
              scrollTrigger: { trigger: "[data-garden]", start: "top bottom", end: "bottom top", scrub: true },
            }
          );

          const timeline = root.querySelector("[data-timeline]");
          if (timeline) {
            gsap
              .timeline({ scrollTrigger: { trigger: timeline, start: "top 80%", end: "bottom 60%", scrub: 0.6 } })
              .fromTo("[data-timeline-line]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 })
              .from("[data-timeline-item]", { autoAlpha: 0, y: 24, stagger: 0.22, duration: 0.3 }, 0.05);
          }

          /* ---------- Curing: pinned, the pod cures as you scroll ---------- */
          const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
          gsap.set(steps.slice(1), { autoAlpha: 0, y: 40 });
          const cure = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: "[data-curing]",
              start: "top top",
              end: `+=${steps.length * 90}%`,
              pin: true,
              scrub: 0.8,
            },
          });
          cure.to("[data-cure-progress]", { scaleY: 1, duration: steps.length }, 0);
          steps.forEach((step, i) => {
            const at = i;
            cure.to("[data-pod]", { attr: { fill: POD_COLORS[i + 1] }, duration: 1 }, at);
            cure.to("[data-curing]", { backgroundColor: CURING_BG[i + 1], duration: 1 }, at);
            if (i > 0) {
              // Old step leaves fully before the new one arrives, so the heavy titles never overlap.
              cure.to(steps[i - 1], { autoAlpha: 0, y: -40, duration: 0.2 }, at - 0.1);
              cure.to(step, { autoAlpha: 1, y: 0, duration: 0.25 }, at + 0.12);
            }
          });
          cure.to("[data-pod-svg]", { scaleX: 0.86, rotate: 4, duration: steps.length * 0.6 }, steps.length * 0.4);
          cure.to("[data-pod-wrinkles]", { opacity: 1, duration: 1.5 }, 2);
          cure.to("[data-pod-sheen]", { attr: { "stroke-opacity": 0.5 }, duration: 1 }, steps.length - 1);

          /* ---------- Parallax images and drawn rules ---------- */
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((wrap) => {
            const img = wrap.querySelector("img");
            if (!img) return;
            gsap.fromTo(
              img,
              { yPercent: -10, scale: 1.2 },
              {
                yPercent: 10,
                scale: 1.2,
                ease: "none",
                scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
              }
            );
          });

          gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
            gsap.fromTo(
              el,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.6,
                ease: "expo.inOut",
                scrollTrigger: { trigger: el, start: "top 80%" },
              }
            );
          });

          gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((row) => {
            gsap
              .timeline({ scrollTrigger: { trigger: row, start: "top 88%" } })
              .fromTo(row.querySelector("[data-rule-line]"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" })
              .from(row.querySelectorAll("[data-rule-text]"), { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.35);
          });

          /* ---------- Finished products: horizontal scroll on wide screens ---------- */
          const track = root.querySelector<HTMLElement>("[data-track]");
          if (wide && track) {
            const distance = () => track.scrollWidth - window.innerWidth;
            const slide = gsap.to(track, {
              x: () => -distance(),
              ease: "none",
              scrollTrigger: {
                trigger: "[data-finished]",
                start: "top top",
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            });
            gsap.utils.toArray<HTMLElement>("[data-panel-img]").forEach((img) => {
              gsap.fromTo(
                img,
                { xPercent: -8 },
                {
                  xPercent: 8,
                  ease: "none",
                  scrollTrigger: {
                    trigger: img.parentElement,
                    containerAnimation: slide,
                    start: "left right",
                    end: "right left",
                    scrub: true,
                  },
                }
              );
            });
          }

          /* ---------- Closing ---------- */
          gsap.fromTo(
            "[data-closing-img]",
            { scale: 1.2, yPercent: -6 },
            {
              scale: 1.05,
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: "[data-closing]", start: "top bottom", end: "bottom top", scrub: true },
            }
          );

          ScrollTrigger.refresh();
          return () => {
            delete root.dataset.animated;
          };
        }
      );
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="group/story overflow-x-clip bg-beige-50 text-forest-950">
      {/* ================= HERO ================= */}
      <section data-hero className="relative flex min-h-[100svh] items-end overflow-hidden bg-secondary text-beige-50">
        <div data-hero-media className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Madagascar_SAVAN_00096_lr-1024x682.webp"
            alt="A farmer's hands lifting freshly harvested green vanilla pods from a woven basket in the grass"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/10" />
        </div>

        <div data-hero-copy className="relative mx-auto w-full max-w-7xl px-5 pb-28 sm:px-8 lg:px-12 lg:pb-32">
          <h1
            data-hero-title
            className="max-w-5xl font-sans text-[clamp(2.8rem,8vw,7.5rem)] font-black leading-[0.9] tracking-[-0.045em]"
          >
            Nine months on the vine.{" "}
            <em className="not-italic text-secondary">Six more</em> to become vanilla.
          </h1>
          <div data-hero-foot className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-md text-base leading-relaxed text-beige-100/80">
              This is the story of our vanilla, from the gardens our parent company {PARENT.name} buys from to the
              jar in your cupboard.
            </p>
            <span className="flex items-center gap-3 text-sm text-beige-100/60">
              <span className="block h-px w-12 bg-beige-100/40" />
              Scroll
            </span>
          </div>
        </div>
      </section>

      {/* ================= GARDEN ================= */}
      <section data-garden id="garden" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-base font-extrabold tracking-tight text-forest-600">The garden</p>
            <p
              data-scrub-words
              className="mt-6 font-sans text-[clamp(1.7rem,3.2vw,2.9rem)] font-bold leading-[1.15] tracking-[-0.035em] text-forest-950"
            >
              Vanilla is the fruit of an orchid. Its pale flower opens for a few hours on one morning, and far from
              Mexico no bee knows how to pollinate it. So at dawn, growers walk the rows and do it by hand, flower by
              flower, with a sliver of wood and a thumb.
            </p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-[8%] rounded-full bg-secondary-light" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-flower
              src="/flowering.png"
              alt="Line drawing of an open vanilla orchid flower"
              loading="lazy"
              className="relative h-full w-full object-contain"
            />
          </div>
        </div>

        <div data-timeline className="relative mt-24 lg:mt-32">
          <div data-timeline-line className="absolute left-0 right-0 top-[7px] hidden h-px origin-left bg-forest-950/25 md:block" />
          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {GARDEN_TIMELINE.map(([when, what]) => (
              <li key={when} data-timeline-item className="relative">
                <span className="block h-[15px] w-[15px] rounded-full border-2 border-forest-950 bg-beige-50" />
                <p className="mt-5 text-xl font-extrabold tracking-tight">{when}</p>
                <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-forest-900/70">{what}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-20 max-w-2xl text-lg leading-relaxed text-forest-900/75">
          The pod hangs for eight or nine months. It is picked by hand when the tip starts to yellow, and at that
          point it has <em>no vanilla flavor at all</em>. That comes later, from curing.
        </p>
      </section>

      {/* ================= CURING (pinned) ================= */}
      <section
        data-curing
        id="curing"
        className="relative overflow-hidden bg-forest-950 text-beige-50 group-data-[animated=true]/story:h-[100svh]"
      >
        <div className="mx-auto grid h-full max-w-7xl items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12 group-data-[animated=true]/story:py-0">
          <div className="relative flex h-[44svh] items-center justify-center gap-8 group-data-[animated=true]/story:h-[34svh] lg:h-[70svh] lg:group-data-[animated=true]/story:h-[78svh]">
            {/* Progress rail */}
            <div className="absolute left-0 top-0 hidden h-full w-px bg-white/10 group-data-[animated=true]/story:block">
              <div data-cure-progress className="h-full w-full origin-top scale-y-0 bg-secondary" />
            </div>
            <div data-pod-svg className="h-full">
              <VanillaPod className="h-full w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
            </div>
          </div>

          <div>
            <p className="text-base font-extrabold tracking-tight text-secondary">Curing</p>
            <h2 data-no-reveal className="mt-3 max-w-xl font-sans text-[clamp(2.2rem,4.4vw,4rem)] font-black leading-[1.02] tracking-[-0.045em]">
              Where the flavor is made, slowly.
            </h2>
            <div className="mt-10 grid gap-12 group-data-[animated=true]/story:gap-0">
              {CURING_STEPS.map((step) => (
                <div key={step.title} data-step className="max-w-xl group-data-[animated=true]/story:[grid-area:1/1]">
                  <p className="font-sans text-[clamp(2.4rem,4.6vw,4.25rem)] font-black leading-none tracking-[-0.045em] text-beige-50">
                    {step.title}
                    <span className="ml-3 align-middle font-sans text-sm font-semibold text-secondary">{step.time}</span>
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-beige-100/75 sm:text-lg">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= GRADING & PACKING ================= */}
      <section id="packaging" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-20 pt-28 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <div>
            <p className="text-base font-extrabold tracking-tight text-forest-600">Grading &amp; packing</p>
            <h2 data-no-reveal data-split className="mt-3 font-sans text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[1] tracking-[-0.045em]">
              Every bean passes through someone&rsquo;s hands once more.
            </h2>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-forest-900/75">
              Before export, the cured beans are sorted by hand. Grade says nothing about flavor. It describes how a
              bean looks and how much moisture it holds, and that tells you how to use it.
            </p>

            <dl className="mt-14">
              {GRADING.map(([term, text]) => (
                <div key={term} data-rule className="relative grid gap-2 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-forest-950/20" />
                  <dt data-rule-text className="text-xl font-extrabold tracking-tight">{term}</dt>
                  <dd data-rule-text className="text-base leading-relaxed text-forest-900/75">{text}</dd>
                </div>
              ))}
            </dl>
            <Link href="/#guide" className="mt-6 inline-block border-b border-forest-950 pb-0.5 text-sm font-semibold hover:border-forest-600 hover:text-forest-600">
              Grade A or Grade B? Read the guide
            </Link>
          </div>

          <div className="grid gap-6 lg:pt-24">
            <div data-clip data-parallax className="aspect-[4/5] overflow-hidden rounded-[1.75rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/our-vanilla-cured-bundle.jpg"
                alt="Cured vanilla beans, sorted and tied in a bundle"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div data-clip className="ml-auto w-3/4 overflow-hidden rounded-[1.75rem] bg-white p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bulk-powder-20kg-2x10kg-pack.webp"
                alt="Two sealed 10 kg food-grade sacks of vanilla powder, packed for bulk shipment"
                loading="lazy"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINISHED PRODUCT (horizontal on wide screens) ================= */}
      <section data-finished id="finished" className="relative overflow-hidden bg-forest-900 text-beige-50 lg:h-[100svh]">
        <div data-track className="flex h-full flex-col gap-6 px-5 py-24 sm:px-8 lg:w-max lg:flex-row lg:items-center lg:gap-8 lg:px-12 lg:py-0">
          <div className="flex shrink-0 flex-col justify-center lg:w-[34vw] lg:pr-10">
            <p className="text-base font-extrabold tracking-tight text-secondary">The finished product</p>
            <h2 data-no-reveal data-split className="mt-3 font-sans text-[clamp(2.4rem,5vw,4.75rem)] font-black leading-[1] tracking-[-0.045em]">
              Then it crosses an ocean to you.
            </h2>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-beige-100/75">
              We ship across the US from {BRAND.address.city}, {BRAND.address.state}. The beans arrive whole, steeped
              into extract, or ground into powder.
            </p>
          </div>

          {FINISHED.map((item, index) => (
            <Link
              key={item.name}
              href={categoryHref(item.category)}
              className="group relative block aspect-[4/5] shrink-0 overflow-hidden rounded-[1.75rem] sm:aspect-[16/10] lg:aspect-auto lg:h-[76svh] lg:w-[44vw]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-panel-img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-[1.18] object-cover transition-[filter] duration-700 group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 sm:p-10">
                <div>
                  <p className="text-sm font-extrabold text-secondary">No. {index + 1}</p>
                  <h3 className="font-sans text-[clamp(2.2rem,4vw,3.75rem)] font-black leading-none tracking-[-0.045em]">{item.name}</h3>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-beige-100/80 sm:text-base">{item.text}</p>
                </div>
                <span className="hidden shrink-0 border-b border-beige-50/60 pb-0.5 text-sm font-semibold transition group-hover:border-secondary group-hover:text-secondary sm:block">
                  Shop
                </span>
              </div>
            </Link>
          ))}
          <div className="hidden w-[6vw] shrink-0 lg:block" />
        </div>
      </section>

      {/* ================= CLOSING ================= */}
      <section data-closing className="relative overflow-hidden bg-forest-950 text-beige-50">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-12 lg:py-32">
          <div>
            <h2 data-no-reveal data-split className="font-sans text-[clamp(2.6rem,5.6vw,5.25rem)] font-black leading-[0.98] tracking-[-0.045em]">
              Those black flecks in real vanilla ice cream? <em className="not-italic text-secondary">A year of work.</em>
            </h2>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-beige-100/70">
              The last step happens in your kitchen. We just make sure the bean that gets there was worth the wait.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <Link
                href="/shop"
                className="rounded-full bg-secondary px-7 py-4 text-sm font-bold text-forest-950 transition hover:bg-secondary-dark"
              >
                Shop our vanilla
              </Link>
              <Link
                href="/wholesale"
                className="border-b border-beige-50/50 pb-0.5 text-sm font-semibold transition hover:border-secondary hover:text-secondary"
              >
                Buying for a bakery or brand?
              </Link>
            </div>
          </div>
          <div data-clip className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[1.75rem] lg:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-closing-img
              src="/Homemade-Vanilla-Ice-Cream-Featured.jpg"
              alt="Scoops of homemade vanilla bean ice cream flecked with seeds, in a glass dish with fresh mint"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
