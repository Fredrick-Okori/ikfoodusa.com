"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

type Section = { id: string; label: string };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Client half of the policy pages: the hero intro, an "On this page" list built from the
 * article's headings that follows your reading position, and a reading-progress rail.
 */
export function LegalSidebar() {
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState(0);

  // Build the contents list from the article's h2s, giving each one an id to link to.
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("[data-legal-article] h2"));
    const used = new Set<string>();
    const found = headings.map((h) => {
      let id = h.id || slug(h.textContent || "section");
      while (used.has(id)) id += "-2";
      used.add(id);
      h.id = id;
      return { id, label: h.textContent || "" };
    });
    // On narrow screens the policy tabs scroll sideways; bring the current one into view.
    const currentTab = document.querySelector<HTMLElement>("[data-legal-tab] [aria-current=page]");
    const tabRow = currentTab?.closest("ul");
    if (currentTab && tabRow && tabRow.scrollWidth > tabRow.clientWidth) {
      const tabBox = currentTab.getBoundingClientRect();
      const rowBox = tabRow.getBoundingClientRect();
      tabRow.scrollLeft += tabBox.left - rowBox.left - (rowBox.width - tabBox.width) / 2;
    }

    // Reading DOM headings rendered by the server component; this only runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSections(found);
  }, []);

  // Hero intro, active-section tracking and reading progress.
  useEffect(() => {
    if (!sections.length) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia();
    let cancelled = false;

    // Active section tracking works with or without motion.
    const triggers = sections.map((section, index) =>
      ScrollTrigger.create({
        trigger: `#${CSS.escape(section.id)}`,
        start: "top 40%",
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index),
        onLeaveBack: () => setActive(Math.max(0, index - 1)),
      })
    );

    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set("[data-legal-title]", { autoAlpha: 1 });
        const title = SplitText.create("[data-legal-title]", { type: "lines", mask: "lines" });
        gsap.set(title.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(title.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1 })
          .fromTo("[data-legal-foot]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.45)
          .fromTo("[data-legal-tab]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05 }, 0.6);

        gsap.fromTo(
          "[data-legal-progress]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-legal-article]", start: "top 30%", end: "bottom 70%", scrub: true },
          }
        );
      });
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      triggers.forEach((t) => t.kill());
      media.revert();
    };
  }, [sections]);

  if (!sections.length) return null;

  return (
    <nav aria-label="On this page" className="relative hidden pl-6 lg:block">
      <span className="absolute inset-y-0 left-0 w-px bg-forest-950/15">
        <span data-legal-progress className="block h-full w-full origin-top bg-secondary-deep" />
      </span>
      <p className="text-sm font-bold text-forest-900/50">On this page</p>
      <ol className="mt-4 space-y-2.5">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={index === active ? "location" : undefined}
              className={`block text-sm leading-snug transition-colors ${
                index === active ? "font-extrabold text-forest-950" : "font-medium text-forest-900/50 hover:text-forest-950"
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
