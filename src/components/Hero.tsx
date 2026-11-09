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
            .fromTo("[data-hero-fact]", { yPercent: 100 }, { yPercent: 0, duration: 1, stagger: 0.1 }, 1.1)
            .fromTo("[data-hero-glow]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.6, ease: "power2.out", stagger: 0.2 }, 0.4)
            .fromTo("[data-hero-halo]", { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 2.2, ease: "power2.out" }, 1);

          // The glow breathes slowly, so the dark never feels flat.
          gsap.to("[data-hero-glow-main]", {
            scale: 1.15,
            xPercent: -6,
            duration: 7,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          gsap.to("[data-hero-glow-low]", {
            xPercent: 18,
            yPercent: -10,
            duration: 9,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          gsap.fromTo(
            "[data-hero-halo]",
            { opacity: 0.75 },
            { opacity: 1, duration: 3.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 3.2 }
          );

          // On desktop a soft light follows the pointer across the hero.
          let removePointer = () => {};
          if (wide && window.matchMedia("(pointer: fine)").matches) {
            const light = section.querySelector<HTMLElement>("[data-hero-light]");
            if (light) {
              const moveX = gsap.quickTo(light, "x", { duration: 1.4, ease: "power3.out" });
              const moveY = gsap.quickTo(light, "y", { duration: 1.4, ease: "power3.out" });
              const onMove = (event: PointerEvent) => {
                const box = section.getBoundingClientRect();
                moveX(event.clientX - box.left - light.offsetWidth / 2);
                moveY(event.clientY - box.top - light.offsetHeight / 2);
                gsap.to(light, { opacity: 1, duration: 0.8, overwrite: "auto" });
              };
              const onLeave = () => gsap.to(light, { opacity: 0, duration: 1.2, overwrite: "auto" });
              section.addEventListener("pointermove", onMove);
              section.addEventListener("pointerleave", onLeave);
              removePointer = () => {
                section.removeEventListener("pointermove", onMove);
                section.removeEventListener("pointerleave", onLeave);
              };
            }
          }

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

          return () => removePointer();
        }
      );
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-forest-950 text-beige-50">
      {/* Green glow: a wide wash behind the photo, a low one under the headline, and a pointer light. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div data-hero-glow className="absolute -right-[20%] -top-[25%] h-[85vmax] w-[85vmax] lg:-right-[12%]">
          <div
            data-hero-glow-main
            className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(156,232,0,0.32),rgba(156,232,0,0.1)_55%,transparent)]"
          />
        </div>
        <div data-hero-glow className="absolute -bottom-[30%] -left-[15%] h-[60vmax] w-[60vmax]">
          <div
            data-hero-glow-low
            className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(156,232,0,0.18),transparent)]"
          />
        </div>
        <div
          data-hero-light
          className="absolute left-0 top-0 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(156,232,0,0.22),transparent)] opacity-0"
        />
        {/* Fine grain keeps the gradients from banding and adds a printed, tactile finish. */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)]" />
      </div>
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
                  className="rounded-full bg-secondary px-7 py-4 text-sm font-extrabold text-forest-950 shadow-[0_0_36px_-6px_rgba(156,232,0,0.6)] transition-[background-color,box-shadow] duration-300 hover:bg-secondary-dark hover:shadow-[0_0_56px_-4px_rgba(156,232,0,0.75)]"
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

          <div className="relative order-first lg:order-none">
          {/* Halo behind the photo (outside the clipped frame so it can spill). */}
          <div
            data-hero-halo
            aria-hidden
            className="absolute -inset-4 rounded-[2.5rem] bg-secondary/45 blur-3xl sm:-inset-6"
          />
          <div
            data-hero-media
            className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem] bg-forest-900 ring-1 ring-secondary/40 sm:aspect-[16/10] lg:aspect-[4/5]"
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
