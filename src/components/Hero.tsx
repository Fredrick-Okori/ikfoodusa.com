"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia(section);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-flower]", { autoAlpha: 0, scale: 0.92, duration: 2.2, ease: "power2.out" }, 0)
        .from("[data-hero-line]", { yPercent: 60, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0)
        .from("[data-hero-cta]", { autoAlpha: 0, y: 16, duration: 0.6 }, "-=0.6")
        .from("[data-hero-scroll]", { autoAlpha: 0, duration: 0.6 }, "-=1");

      gsap.to("[data-neon-layer]", {
        opacity: 0.75,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 2.6,
      });

      // Scroll-linked zoom: as the hero scrolls away the headline grows toward the viewer (staying fully visible)
      // while the flower shrinks back; scrolling up reverses it. `scrub` eases the animation toward the scroll
      // position instead of snapping to it, which is what makes it feel smooth.
      const zoom = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "clamp(top bottom)",
          end: "bottom top",
          scrub: 1, // Lenis smooths the scroll itself; this adds a gentle extra glide
          invalidateOnRefresh: true,
        },
      });
      zoom
        .to("[data-hero-zoom]", { scale: 1.9, y: () => window.innerHeight * 0.22 }, 0)
        .to("[data-hero-flower-zoom]", { scale: 0.45, rotate: 14, autoAlpha: 0 }, 0)
        .to("[data-hero-cta-zoom]", { y: () => window.innerHeight * 0.18, autoAlpha: 0, duration: 0.6 }, 0);
    });

    return () => media.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-[#111210] text-white"
    >
      {/* Neon backdrop */}
      <div data-neon-layer aria-hidden="true" className="absolute inset-0 -z-10">
        {/* Faint neon vanilla orchid behind the headline (outer layer zooms on scroll) */}
        <div data-hero-flower-zoom className="absolute inset-0 will-change-transform">
        <div
          data-hero-flower
          className="absolute left-1/2 top-1/2 aspect-[633/570] w-[min(70vw,32rem)] -translate-x-1/2 -translate-y-1/2 opacity-[0.34] sm:w-[min(50vw,32rem)]"
        >
          <Image
            src="/flowering.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 512px, 70vw"
            className="-rotate-[8deg] object-contain"
            style={{
              filter:
                "brightness(1.35) saturate(1.5) drop-shadow(0 0 3px var(--color-secondary)) drop-shadow(0 0 14px rgba(156,232,0,0.7)) drop-shadow(0 0 36px rgba(156,232,0,0.45))",
            }}
          />
        </div>
        </div>
        {/* soft green haze behind the headline */}
        <div className="absolute left-1/2 top-1/2 h-[40%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/[0.06] blur-[90px]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-88px)] max-w-7xl flex-col items-center justify-center px-4 py-16 sm:min-h-[calc(100svh-6rem)] sm:px-6 lg:min-h-[calc(100svh-106px)] lg:px-10">
        <div data-hero-zoom className="pointer-events-none relative text-[clamp(2.75rem,16vw,9.5rem)] will-change-transform">
          <h1
            id="hero-title"
            className="relative z-10 text-center font-sans font-black leading-[0.88] tracking-[-0.045em]"
          >
            <span data-hero-line className="block text-[#8d8f8a]">
              Pure vanilla,
            </span>
            <span data-hero-line className="block">
              from bean
            </span>
            <span data-hero-line className="block">
              to bottle<span className="text-secondary">.</span>
            </span>
          </h1>
        </div>

        <div data-hero-cta-zoom className="relative z-20">
        <Link
          data-hero-cta
          href="/shop"
          className="group mt-10 inline-flex items-center gap-4 rounded-full py-2 pl-5 pr-2 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white/5 sm:mt-14 sm:text-base"
        >
          Shop vanilla
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-beige-50 text-forest-950 shadow-[0_0_0_0_rgba(156,232,0,0.6)] transition duration-300 group-hover:bg-secondary group-hover:shadow-[0_0_24px_4px_rgba(156,232,0,0.45)] sm:h-14 sm:w-14">
            <ShoppingBag size={20} aria-hidden="true" />
          </span>
        </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        data-hero-scroll
        aria-hidden="true"
        className="absolute right-8 top-1/2 hidden h-[34%] -translate-y-1/2 flex-col items-center lg:flex"
      >
        <span className="w-px flex-1 bg-gradient-to-b from-transparent via-secondary/60 to-secondary shadow-[0_0_6px_rgba(156,232,0,0.8),0_0_14px_rgba(156,232,0,0.45)]" />
        <span className="mt-0 flex h-6 w-6 items-center justify-center rounded-full border border-secondary shadow-[0_0_8px_rgba(156,232,0,0.7),inset_0_0_6px_rgba(156,232,0,0.35)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary shadow-[0_0_8px_2px_rgba(156,232,0,0.9)]" />
        </span>
      </div>
    </section>
  );
}
