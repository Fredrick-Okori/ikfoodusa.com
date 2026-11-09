import gsap from "gsap";

/** Burnt orange, matching --color-ember-500 in globals.css. */
export const EMBER = "#cc5500";

/**
 * Scroll-scrubbed "reading" effect: each word starts faint, flares burnt orange as the
 * scroll reaches it, then cools to the paragraph's own colour a few words later.
 * Words inside a [data-ember] element stay burnt orange.
 */
export function emberWords(el: HTMLElement, words: Element[]) {
  const base = getComputedStyle(el).color;
  const settle = (_: number, word: Element) => (word.closest("[data-ember]") ? EMBER : base);

  return gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    })
    .fromTo(words, { opacity: 0.15, color: base }, { opacity: 1, color: EMBER, duration: 0.2, stagger: 0.08 }, 0)
    .to(words, { color: settle, duration: 0.35, stagger: 0.08 }, 0.3);
}
