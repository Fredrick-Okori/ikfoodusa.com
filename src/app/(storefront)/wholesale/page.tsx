"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { BRAND } from "@/lib/brand";
import { BUSINESS_TYPES, ORDER_FREQUENCIES } from "@/lib/b2b";

type Tab = "account" | "quote";

const input =
  "h-12 w-full border-0 border-b-2 border-forest-950/15 bg-transparent px-0 text-base font-semibold text-forest-950 outline-none transition-colors placeholder:font-normal placeholder:text-forest-900/35 focus:border-forest-950";
const textarea =
  "w-full resize-y border-0 border-b-2 border-forest-950/15 bg-transparent px-0 py-3 text-base font-semibold text-forest-950 outline-none transition-colors placeholder:font-normal placeholder:text-forest-900/35 focus:border-forest-950";
const label = "block text-sm font-bold text-forest-900/60";
const submitButton =
  "flex items-center justify-center gap-2 rounded-full bg-secondary px-8 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark disabled:opacity-60 sm:col-span-2 sm:justify-self-start";
const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";

const BENEFITS = [
  { title: "Trade pricing", text: "Approved accounts see trade prices at checkout, below retail and volume pricing." },
  { title: "Net-30 invoicing", text: "Invoice terms for established businesses, with PO numbers on every order." },
  { title: "Bulk & by the pound", text: "Beans, splits, powder and extract in bulk packs for production kitchens." },
  { title: "Direct from Uganda", text: `${BRAND.name} is the US branch of IK Food Uganda, so you buy straight from the exporter.` },
];

const STEPS = [
  { title: "Apply", text: "Tell us about your business. It takes two minutes." },
  { title: "Get approved", text: "We review applications within 1–2 business days and email your trade account code." },
  { title: "Order your way", text: "Check out online at trade prices, or request a quote for large and recurring orders." },
];

const WHO = [
  "Bakeries & pastry shops",
  "Ice cream & dairy makers",
  "Restaurants & cafés",
  "Food & beverage manufacturers",
  "Extract & flavor producers",
  "Distributors & specialty retailers",
];

function Success({ title, text, onReset }: { title: string; text: string; onReset: () => void }) {
  return (
    <div className="py-10">
      <h3 className={`${heading} text-[clamp(2.25rem,4.5vw,3.75rem)] text-forest-950`}>
        {title}<span className="text-beige-400">.</span>
      </h3>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-forest-900/70">{text}</p>
      <button onClick={onReset} className="mt-8 border-b-2 border-forest-950 pb-1 text-sm font-extrabold hover:border-forest-950/40">
        Submit another
      </button>
    </div>
  );
}

function TradeAccountForm() {
  const empty = {
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    businessType: "",
    taxId: "",
    website: "",
    address: "",
    expectedVolume: "",
    message: "",
  };
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const bind = (key: keyof typeof empty) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/trade-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <Success
        title="Application received"
        text={`Thanks, ${form.contactName.split(" ")[0]}. We'll review it and email ${form.email} with your trade account code, usually within 1–2 business days.`}
        onReset={() => {
          setForm(empty);
          setStatus("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
      <div>
        <label htmlFor="ta-company" className={label}>Company name *</label>
        <input id="ta-company" required autoComplete="organization" className={input} {...bind("companyName")} />
      </div>
      <div>
        <label htmlFor="ta-type" className={label}>Business type *</label>
        <select id="ta-type" required className={input} {...bind("businessType")}>
          <option value="">Select</option>
          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ta-name" className={label}>Contact name *</label>
        <input id="ta-name" required autoComplete="name" className={input} {...bind("contactName")} />
      </div>
      <div>
        <label htmlFor="ta-email" className={label}>Work email *</label>
        <input id="ta-email" type="email" required autoComplete="email" className={input} {...bind("email")} />
      </div>
      <div>
        <label htmlFor="ta-phone" className={label}>Phone</label>
        <input id="ta-phone" type="tel" autoComplete="tel" className={input} {...bind("phone")} />
      </div>
      <div>
        <label htmlFor="ta-tax" className={label}>EIN or resale certificate #</label>
        <input id="ta-tax" className={input} {...bind("taxId")} />
      </div>
      <div>
        <label htmlFor="ta-web" className={label}>Website</label>
        <input id="ta-web" type="url" placeholder="https://" className={input} {...bind("website")} />
      </div>
      <div>
        <label htmlFor="ta-volume" className={label}>Expected volume</label>
        <input id="ta-volume" placeholder="e.g. 10 lb (5 kg) beans / month" className={input} {...bind("expectedVolume")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ta-address" className={label}>Business address</label>
        <input id="ta-address" autoComplete="street-address" className={input} {...bind("address")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ta-message" className={label}>Anything else we should know?</label>
        <textarea
          id="ta-message"
          rows={3}
          className={textarea}
          {...bind("message")}
        />
      </div>
      {error && <p role="alert" className="border-l-4 border-red-600 pl-4 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className={submitButton}
      >
        {status === "sending" && <Loader2 size={16} className="animate-spin" />}
        Apply for a trade account
      </button>
    </form>
  );
}

function QuoteForm() {
  const empty = {
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    products: "",
    quantity: "",
    frequency: "",
    deliveryLocation: "",
    message: "",
  };
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const bind = (key: keyof typeof empty) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <Success
        title="Quote request received"
        text={`Thanks, ${form.contactName.split(" ")[0]}. Our team will reply to ${form.email} with pricing and lead times.`}
        onReset={() => {
          setForm(empty);
          setStatus("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
      <div>
        <label htmlFor="q-company" className={label}>Company name *</label>
        <input id="q-company" required autoComplete="organization" className={input} {...bind("companyName")} />
      </div>
      <div>
        <label htmlFor="q-name" className={label}>Contact name *</label>
        <input id="q-name" required autoComplete="name" className={input} {...bind("contactName")} />
      </div>
      <div>
        <label htmlFor="q-email" className={label}>Work email *</label>
        <input id="q-email" type="email" required autoComplete="email" className={input} {...bind("email")} />
      </div>
      <div>
        <label htmlFor="q-phone" className={label}>Phone</label>
        <input id="q-phone" type="tel" autoComplete="tel" className={input} {...bind("phone")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="q-products" className={label}>Products needed *</label>
        <input id="q-products" required placeholder="e.g. Grade B Planifolia beans, double fold extract" className={input} {...bind("products")} />
      </div>
      <div>
        <label htmlFor="q-qty" className={label}>Quantity *</label>
        <input id="q-qty" required placeholder="e.g. 50 lb (25 kg), 200 bottles" className={input} {...bind("quantity")} />
      </div>
      <div>
        <label htmlFor="q-freq" className={label}>How often?</label>
        <select id="q-freq" className={input} {...bind("frequency")}>
          <option value="">Select</option>
          {ORDER_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="q-loc" className={label}>Delivery city, state (or country for export)</label>
        <input id="q-loc" className={input} {...bind("deliveryLocation")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="q-message" className={label}>Specs or notes</label>
        <textarea
          id="q-message"
          rows={3}
          placeholder="Bean length, moisture, packaging, certifications, target date…"
          className={textarea}
          {...bind("message")}
        />
      </div>
      {error && <p role="alert" className="border-l-4 border-red-600 pl-4 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className={submitButton}
      >
        {status === "sending" && <Loader2 size={16} className="animate-spin" />}
        Request a quote
      </button>
    </form>
  );
}

export default function WholesalePage() {
  const [tab, setTab] = useState<Tab>("account");
  const mainRef = useRef<HTMLElement>(null);

  /* Scroll animations: same vocabulary as the home page. */
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia(main);
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: headline rises line by line, then the rest follows. (globals.css hides the
        // headline until this point so it doesn't flash before the animation.)
        gsap.set("[data-hero-title]", { autoAlpha: 1 });
        const title = SplitText.create("[data-hero-title]", { type: "lines", mask: "lines" });
        gsap.set(title.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(title.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.1 })
          .fromTo("[data-hero-foot]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.5)
          .fromTo(
            "[data-hero-media]",
            { clipPath: "inset(100% 0% 0% 0% round 28px)" },
            { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.6, ease: "expo.inOut" },
            0.2
          );
        gsap.to("[data-hero-media] img", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
        });

        // Section headings.
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const split = SplitText.create(el, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          gsap.fromTo(
            split.lines,
            { yPercent: 105 },
            { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 86%" } }
          );
        });

        // "We supply" marquee reacts to scroll speed and direction.
        const marquee = gsap.to("[data-marquee-track]", { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
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

        // Ruled rows: the line draws, then the row's text arrives.
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

        // Steps light up along the line as you scroll.
        const steps = { trigger: "[data-steps]", start: "top 80%", end: "bottom 55%", scrub: true };
        gsap.fromTo("[data-step]", { opacity: 0.18 }, { opacity: 1, stagger: 0.5, ease: "none", scrollTrigger: steps });
        gsap.fromTo("[data-steps-line]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: steps });
      });
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      media.revert();
    };
  }, []);

  // Switching forms slides the new one in.
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-form-panel]", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" });
    gsap.fromTo("[data-tab-copy]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [tab]);

  return (
    <main ref={mainRef} className="overflow-x-clip bg-beige-50 text-forest-950">
      {/* HERO */}
      <section data-hero className="bg-forest-950 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:px-12 lg:pb-28 lg:pt-28">
          <h1 data-hero-title className={`${heading} max-w-6xl text-[clamp(3rem,8.5vw,8rem)]`}>
            Wholesale vanilla, <span className="text-beige-300">direct from the exporter.</span>
          </h1>

          <div className="mt-14 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
            <div>
              <p data-hero-foot className="max-w-lg text-lg leading-relaxed text-beige-100/75 sm:text-xl">
                Trade pricing, volume discounts and bulk or export quantities for bakeries, food manufacturers,
                distributors and kitchens across the US.
              </p>
              <div data-hero-foot className="mt-10 flex flex-wrap items-center gap-8">
                <a
                  href="#apply"
                  onClick={() => setTab("account")}
                  className="rounded-full bg-secondary px-7 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
                >
                  Open a trade account
                </a>
                <a
                  href="#apply"
                  onClick={() => setTab("quote")}
                  className="border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary transition-colors hover:border-beige-50 hover:text-beige-50"
                >
                  Request a bulk quote
                </a>
              </div>
            </div>
            <div data-hero-media className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bulk-powder-20kg-2x10kg-pack.webp"
                alt="Bulk vanilla powder in two 10 kg (22 lb) bags"
                className="absolute inset-0 h-full w-full scale-110 object-contain p-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WE SUPPLY */}
      <section data-marquee aria-label="Who we supply" className="overflow-hidden bg-beige-100 py-5 text-forest-950 sm:py-7">
        <ul className="sr-only">
          {WHO.map((w) => <li key={w}>{w}</li>)}
        </ul>
        <div data-marquee-track aria-hidden className="flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {WHO.map((w) => (
                <span key={w} className="flex items-center">
                  <span className="whitespace-nowrap px-6 text-[clamp(1.75rem,4vw,3.5rem)] font-black leading-none tracking-[-0.04em] sm:px-10">
                    {w}
                  </span>
                  <span className="h-3 w-3 rounded-full bg-forest-950 sm:h-4 sm:w-4" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-forest-950 text-beige-50">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <h2 data-no-reveal data-split className={`${heading} max-w-4xl text-[clamp(2.75rem,7vw,6rem)]`}>
          What a trade account gets you.
        </h2>
        <ul className="mt-16">
          {BENEFITS.map((b) => (
            <li key={b.title} data-rule className="relative grid gap-3 py-8 md:grid-cols-[1.1fr_1fr] md:items-baseline md:gap-12">
              <span data-rule-line className="absolute inset-x-0 top-0 h-px origin-left bg-beige-50/15" />
              <h3 data-rule-text className="text-[clamp(1.9rem,4vw,3.25rem)] font-black leading-none tracking-[-0.04em]">
                {b.title}
              </h3>
              <p data-rule-text className="max-w-md text-lg leading-relaxed text-beige-100/65">{b.text}</p>
            </li>
          ))}
        </ul>
        <span className="block h-px bg-beige-50/15" />
      </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-forest-900 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.75rem,7vw,6rem)]`}>
            Three steps to trade prices.
          </h2>
          <div data-steps className="relative mt-16 lg:mt-20">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10">
              <div data-steps-line className="h-full w-full origin-left bg-beige-200" />
            </div>
            <ol className="grid gap-10 pt-10 md:grid-cols-3 md:gap-10">
              {STEPS.map((step) => (
                <li key={step.title} data-step>
                  <h3 className="text-[clamp(2rem,3.6vw,3rem)] font-black leading-none tracking-[-0.04em] text-beige-50">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-xs text-base leading-relaxed text-beige-100/70">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* APPLY / QUOTE */}
      <section id="apply" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <h2 data-no-reveal data-split className={`${heading} text-[clamp(2.75rem,6vw,5.25rem)]`}>
              Let&rsquo;s talk volume.
            </h2>
            <p data-tab-copy className="mt-8 max-w-md text-lg leading-relaxed text-forest-900/70">
              {tab === "account"
                ? "Approved accounts get a trade account code to enter at checkout for trade pricing, PO numbers and (for established businesses) Net-30 invoices."
                : "For large, recurring or export orders, tell us what you need and we'll come back with pricing, availability and lead times."}
            </p>

            <div className="mt-12">
              <div className="relative py-6">
                <span className="absolute inset-x-0 top-0 h-px bg-forest-950/20" />
                <p className="text-base leading-relaxed text-forest-900/70">
                  <span className="font-extrabold text-forest-950">Not ready for an account?</span> Anyone can buy online.
                  Volume pricing applies automatically on larger quantities.
                </p>
              </div>
              <div className="relative py-6">
                <span className="absolute inset-x-0 top-0 h-px bg-forest-950/20" />
                <p className="text-base leading-relaxed text-forest-900/70">
                  <span className="font-extrabold text-forest-950">Already approved?</span> Enter your trade account code
                  in the{" "}
                  <Link href="/cart" className="font-bold text-forest-950 underline underline-offset-4">cart</Link>.
                </p>
              </div>
              <div className="relative py-6">
                <span className="absolute inset-x-0 top-0 h-px bg-forest-950/20" />
                <p className="text-base leading-relaxed text-forest-900/70">
                  <span className="font-extrabold text-forest-950">Questions?</span>{" "}
                  <a href={`mailto:${BRAND.email}`} className="font-bold text-forest-950 underline underline-offset-4">{BRAND.email}</a>{" "}
                  or call{" "}
                  <a href={`tel:${BRAND.phoneE164}`} className="font-bold text-forest-950 underline underline-offset-4">{BRAND.phone}</a>.
                </p>
                <p className="mt-3 text-sm text-forest-900/55">
                  {BRAND.legalName} · {BRAND.address.street}, {BRAND.address.unit}, {BRAND.address.city}, {BRAND.address.state} {BRAND.address.zip}
                </p>
              </div>
              <span className="block h-px bg-forest-950/20" />
            </div>
          </div>

          <div>
            <div role="tablist" aria-label="Wholesale forms" className="mb-12 flex flex-wrap gap-x-10 gap-y-3">
              {(
                [
                  { id: "account", label: "Trade account" },
                  { id: "quote", label: "Bulk / export quote" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`border-b-4 pb-2 text-[clamp(1.5rem,2.6vw,2.25rem)] font-black leading-none tracking-[-0.04em] transition-colors ${
                    tab === t.id
                      ? "border-secondary text-forest-950"
                      : "border-transparent text-forest-950/30 hover:text-forest-950/60"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div data-form-panel role="tabpanel">
              {tab === "account" ? <TradeAccountForm /> : <QuoteForm />}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
