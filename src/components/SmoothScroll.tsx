"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

/**
 * Site-wide smooth scrolling (Lenis) driven by GSAP's ticker, so ScrollTrigger animations
 * (hero zoom, text reveals) stay perfectly in sync with the smoothed scroll position.
 *
 * Lenis keeps native scrolling underneath, so sticky/fixed elements, keyboard scrolling and
 * scrollbars all keep working. It is skipped entirely for visitors who prefer reduced motion.
 */
let lenis: Lenis | null = null;

/** Pause/resume smooth scrolling, e.g. while a full-screen menu is open. */
export function setSmoothScrollPaused(paused: boolean) {
  if (!lenis) return;
  if (paused) lenis.stop();
  else lenis.start();
}

export function SmoothScroll() {
  const pathname = usePathname();

  // Create Lenis once and hand its frame loop to GSAP.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      lerp: 0.085, // lower = smoother/floatier, higher = snappier
      smoothWheel: true,
      anchors: { offset: -24 }, // smooth-scroll "/#section" links
      stopInertiaOnNavigate: true,
      autoRaf: false,
    });
    lenis = instance;

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      if (lenis === instance) lenis = null;
    };
  }, []);

  // Per page: start at the top, re-measure, and reveal section headings as they scroll in.
  useEffect(() => {
    // Anchor links ("/#story") scroll to their section instead.
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true });

    const media = gsap.matchMedia();
    let frame = 0;
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      // Wait a frame so the new page's content is in the DOM. Running the setup through
      // context.add() records the triggers so they are cleaned up when the page changes.
      frame = requestAnimationFrame(() => context.add(() => {
        const targets = gsap.utils.toArray<HTMLElement>(
          "#main-content h2:not([data-no-reveal]), #main-content [data-reveal]"
        );
        if (!targets.length) return;
        gsap.set(targets, { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch(targets, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.08 }),
        });
        ScrollTrigger.refresh();
      }));
    });

    return () => {
      cancelAnimationFrame(frame);
      media.revert();
    };
  }, [pathname]);

  return null;
}
