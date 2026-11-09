"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BRAND, PARENT } from "@/lib/brand";
import { categoryHref } from "@/data/products";
import { useCategories } from "@/lib/useCatalog";
import { LEGAL_LINKS } from "@/components/LegalPage";

const columnTitle = "text-lg font-black tracking-[-0.03em] text-beige-50";
const footerLink = "font-semibold text-beige-100/65 transition-colors hover:text-secondary";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { categories } = useCategories();
  const footerRef = useRef<HTMLElement>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 3000);
  };

  // The giant wordmark rises into place as the footer scrolls in.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(footer);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        "[data-footer-mark]",
        { yPercent: 45 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
    return () => media.revert();
  }, []);

  return (
    <footer ref={footerRef} className="overflow-hidden bg-forest-950 text-beige-100">
      <div className="mx-auto max-w-7xl px-5 pt-24 sm:px-8 lg:px-12 lg:pt-32">
        {/* Newsletter */}
        <div className="grid gap-12 border-b border-white/10 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
          <div>
            <p className="font-sans text-[clamp(2.75rem,6.5vw,5.75rem)] font-black leading-[0.92] tracking-[-0.045em] text-beige-50">
              Get the Vanilla Letter<span className="text-beige-300">.</span>
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-beige-100/65">
              Harvest updates, baking recipes and early access to small-lot beans.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-end gap-6">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-14 min-w-0 flex-1 border-0 border-b-2 border-beige-50/25 bg-transparent px-0 text-xl font-bold text-beige-50 outline-none transition-colors placeholder:font-medium placeholder:text-beige-50/30 focus:border-secondary sm:text-2xl"
            />
            <button
              type="submit"
              className="mb-1 shrink-0 rounded-full bg-secondary px-7 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </form>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-16 text-base md:grid-cols-4 lg:py-20">
          <div>
            <h2 className={columnTitle}>Shop</h2>
            <ul className="mt-5 space-y-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link href={categoryHref(category.name)} className={footerLink}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={columnTitle}>Learn</h2>
            <ul className="mt-5 space-y-3">
              <li><Link href="/our-vanilla" className={footerLink}>Our vanilla</Link></li>
              <li><Link href="/#guide" className={footerLink}>Grade A vs Grade B</Link></li>
              <li><Link href="/#shipping" className={footerLink}>Storing vanilla beans</Link></li>
              <li><Link href="/wholesale" className={footerLink}>Wholesale &amp; trade</Link></li>
              <li><Link href="/wholesale#apply" className={footerLink}>Bulk &amp; export quotes</Link></li>
              <li><Link href="/shipping-returns" className={footerLink}>Shipping &amp; returns</Link></li>
            </ul>
          </div>

          <div>
            <h2 className={columnTitle}>
              <a href={PARENT.url} target="_blank" rel="noreferrer" className="transition-colors hover:text-secondary">
                {PARENT.name} <span aria-hidden>&#8599;</span>
              </a>
            </h2>
            <address className="mt-5 space-y-3 not-italic leading-relaxed text-beige-100/65">
              <p>
                {PARENT.poBox}, {PARENT.street}
                <br />
                {PARENT.city}, {PARENT.country}
              </p>
              <p>
                <a href={`tel:${PARENT.phoneE164}`} className={footerLink}>{PARENT.phone}</a>
              </p>
              <p>
                <a href={`mailto:${PARENT.email}`} className={`${footerLink} break-all`}>{PARENT.email}</a>
              </p>
            </address>
          </div>

          <div>
            <h2 className={columnTitle}>{BRAND.name}</h2>
            <address className="mt-5 space-y-3 not-italic leading-relaxed text-beige-100/65">
              <p>
                {BRAND.legalName}
                <br />
                {BRAND.address.street}, {BRAND.address.unit}
                <br />
                {BRAND.address.city}, {BRAND.address.stateName} {BRAND.address.zip}
              </p>
              <p>
                <a href={`tel:${BRAND.phoneE164}`} className={footerLink}>{BRAND.phone}</a>
              </p>
              <p>
                <a href={`mailto:${BRAND.email}`} className={`${footerLink} break-all`}>{BRAND.email}</a>
              </p>
            </address>
            <p className="mt-6 flex gap-6">
              <a href={BRAND.social.instagram} target="_blank" rel="noreferrer" className="border-b-2 border-secondary pb-0.5 font-extrabold text-beige-50 transition-colors hover:text-secondary">
                Instagram
              </a>
              <a href={BRAND.social.facebook} target="_blank" rel="noreferrer" className="border-b-2 border-secondary pb-0.5 font-extrabold text-beige-50 transition-colors hover:text-secondary">
                Facebook
              </a>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-5 border-t border-white/10 py-8 text-sm text-beige-100/50 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.legalName} · the US branch of {BRAND.parentCompany}.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="py-1 font-semibold transition-colors hover:text-beige-50">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Giant wordmark */}
      <p
        data-footer-mark
        aria-hidden
        className="select-none whitespace-nowrap px-3 pb-[0.04em] text-center font-sans text-[clamp(4rem,19vw,20rem)] font-black leading-[0.9] tracking-[-0.06em] text-beige-50"
      >
        {BRAND.shortName}
        <span className="text-beige-300">.</span>
      </p>
    </footer>
  );
}
