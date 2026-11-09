"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { BRAND, PARENT } from "@/lib/brand";
import { formatUSD } from "@/utils/currency";

const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";

const FACTS = [
  ["Grown with", PARENT.name],
  ["Ships in", "1–2 business days"],
  ["Free US shipping", `Over ${formatUSD(BRAND.freeShippingThreshold)}`],
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia(section);
    let cancelled = false;

    // Wait for the web fonts so the headline splits at its real line breaks.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 1024px)" },
        (context) => {
          const { motion, wide } = context.conditions as { motion: boolean; wide: boolean };
          if (!motion) return;

          // globals.css hides the headline and clips the photo until this runs.
          gsap.set("[data-hero-title]", { autoAlpha: 1 });
          const title = SplitText.create("[data-hero-title]", { type: "lines", mask: "lines" });
          gsap.set(title.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });

          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .fromTo(title.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.11 }, 0.1)
            .fromTo(
              "[data-hero-media]",
              { clipPath: "inset(18% 22% 18% 22% round 32px)" },
              { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.7, ease: "expo.inOut" },
              0
            )
            .fromTo("[data-hero-media] img", { scale: 1.4 }, { scale: 1.08, duration: 2.2 }, 0)
            .fromTo("[data-hero-foot]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.7)
            .fromTo("[data-hero-rule-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: "expo.inOut", stagger: 0.12 }, 0.8)
            .fromTo("[data-hero-fact]", { yPercent: 100 }, { yPercent: 0, duration: 1, stagger: 0.1 }, 1.1);

          // Scrolling away: the photo drifts inside its frame and the headline lifts off.
          gsap.to("[data-hero-media] img", {
            yPercent: 10,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          });
          gsap.to("[data-hero-copy]", {
            yPercent: wide ? -18 : -8,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          });
        }
      );
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className="relative overflow-hidden bg-forest-950 text-beige-50">
      <div className="mx-auto flex min-h-[calc(100svh-88px)] max-w-7xl flex-col px-5 pb-10 pt-14 sm:min-h-[calc(100svh-6rem)] sm:px-8 lg:min-h-[calc(100svh-106px)] lg:px-12 lg:pb-12 lg:pt-20">
        <div className="grid flex-1 gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-14">
          <div data-hero-copy>
            <h1
              id="hero-title"
              data-hero-title
              data-no-reveal
              className={`${heading} text-[clamp(3.25rem,9.6vw,9.25rem)]`}
            >
              Pure vanilla, from bean to bottle<span className="text-beige-300">.</span>
            </h1>

            <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between lg:mt-14">
              <p data-hero-foot className="max-w-md text-lg leading-relaxed text-beige-100/70 sm:text-xl">
                Hand-pollinated, slow-cured vanilla beans, extract and powder, shipped across the US by the American
                branch of {PARENT.name}.
              </p>
              <div data-hero-foot className="flex shrink-0 flex-wrap items-center gap-8">
                <Link
                  href="/shop"
                  className="rounded-full bg-secondary px-7 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
                >
                  Shop vanilla
                </Link>
                <Link
                  href="/our-vanilla"
                  className="border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary transition-colors hover:border-beige-50 hover:text-beige-50"
                >
                  Our story
                </Link>
              </div>
            </div>
          </div>

          <div
            data-hero-media
            className="relative order-first aspect-[16/11] overflow-hidden rounded-[1.75rem] bg-forest-900 sm:aspect-[16/10] lg:order-none lg:aspect-[4/5]"
          >
            <Image
              src="/our-vanilla-cured-bundle.jpg"
              alt="A bundle of glossy, cured dark vanilla beans tied with twine"
              fill
              priority
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="scale-[1.08] object-cover"
            />
          </div>
        </div>

        {/* Ruled facts */}
        <dl className="mt-14 grid gap-x-10 sm:grid-cols-3 lg:mt-20">
          {FACTS.map(([label, value]) => (
            <div key={label} className="relative pt-5 pb-1">
              <span data-hero-rule-line className="absolute inset-x-0 top-0 block h-px origin-left bg-beige-50/20" />
              <div className="overflow-hidden">
                <div data-hero-fact className="flex items-baseline justify-between gap-4 sm:block">
                  <dt className="text-sm font-bold text-beige-100/50">{label}</dt>
                  <dd className="text-lg font-extrabold tracking-[-0.02em] text-beige-50 sm:mt-1">{value}</dd>
                </div>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
