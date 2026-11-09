"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Minus, Plus } from "lucide-react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useCart } from "@/components/CartContext";
import { ProductImage } from "@/components/ProductImage";
import { BRAND } from "@/lib/brand";
import { Order, PAYMENT_METHODS, PaymentMethodId } from "@/lib/orders";
import { computeTotals, lookupPromo } from "@/lib/promotions";
import { US_STATES } from "@/lib/usStates";
import { formatUSD, roundCents } from "@/utils/currency";
import { unitPriceFor } from "@/lib/pricing";
import { formatSize } from "@/lib/units";
import { VerifiedTradeAccount } from "@/lib/b2b";
import type { CartItem } from "@/components/CartContext";

type Step = "bag" | "checkout" | "success";

const inputClass =
  "h-12 w-full border-0 border-b-2 border-forest-950/15 bg-transparent px-0 text-base font-semibold text-forest-950 outline-none transition-colors placeholder:font-normal placeholder:text-forest-900/35 read-only:text-forest-900/60 focus:border-forest-950";
const labelClass = "block text-sm font-bold text-forest-900/60";
const heading = "font-sans font-black leading-[0.92] tracking-[-0.045em]";
const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark disabled:opacity-60";
const textLink = "border-b-2 border-forest-950 pb-0.5 font-extrabold transition-colors hover:border-forest-950/40";

/** Formats a 10-digit US number as (555) 123-4567 once complete; leaves anything else as typed. */
function formatUSPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return value;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

export default function CartPage() {
  const { items, count, removeFromCart, updateQuantity, clearCart } = useCart();

  const [step, setStep] = useState<Step>("bag");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(PAYMENT_METHODS[0].id);

  // B2B: optional business purchase / verified trade account
  const [isBusiness, setIsBusiness] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [tradeCode, setTradeCode] = useState("");
  const [tradeEmail, setTradeEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [trade, setTrade] = useState<{
    account: VerifiedTradeAccount;
    code: string;
    email: string;
    prices: Record<string, { price: number; minQty: number }>;
  } | null>(null);

  const linePrice = (item: CartItem) => {
    const tp = trade?.prices[item.id];
    return unitPriceFor(
      { ...item, wholesalePrice: tp?.price, wholesaleMinQty: tp?.minQty },
      item.quantity,
      Boolean(trade)
    );
  };
  const subtotal = roundCents(items.reduce((sum, item) => sum + linePrice(item).price * item.quantity, 0));
  const availableMethods = PAYMENT_METHODS.filter((m) => m.id !== "Invoice" || trade?.account.netTerms);

  const verifyTradeAccount = async () => {
    setTradeError(null);
    setIsVerifying(true);
    try {
      const res = await fetch("/api/trade-accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tradeCode, email: tradeEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verification failed");
      const email = tradeEmail.trim().toLowerCase();
      setTrade({ account: data.account, code: tradeCode.trim().toUpperCase(), email, prices: data.tradePrices || {} });
      setIsBusiness(true);
      setCompanyName(data.account.companyName);
      setForm((f) => ({ ...f, email, fullName: f.fullName || data.account.contactName }));
      setPromoCode(null);
      setPromoMessage(null);
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearTrade = () => {
    setTrade(null);
    if (paymentMethod === "Invoice") setPaymentMethod(PAYMENT_METHODS[0].id);
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("step") === "checkout") setStep("checkout");
  }, []);

  const totals = useMemo(() => computeTotals(subtotal, trade ? null : promoCode), [subtotal, promoCode, trade]);
  const discounted = totals.subtotal - totals.discount;
  const amountToFreeShipping = Math.max(0, BRAND.freeShippingThreshold - discounted);
  const shippingProgress = Math.min(100, Math.round((discounted / BRAND.freeShippingThreshold) * 100));

  // Title rises line by line and rows stagger in whenever the view changes.
  const rootRef = useRef<HTMLDivElement>(null);
  const isEmpty = items.length === 0;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(SplitText);
    const media = gsap.matchMedia(root);
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const title = root.querySelector("[data-cart-title]");
        if (title) {
          gsap.set(title, { autoAlpha: 1 });
          const split = SplitText.create(title, { type: "lines", mask: "lines" });
          gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          gsap.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 });
        }
        gsap.fromTo(
          root.querySelectorAll("[data-cart-in]"),
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.15 }
        );
        gsap.fromTo(
          root.querySelectorAll("[data-cart-line]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: "expo.inOut", stagger: 0.06 }
        );
      });
    });
    return () => {
      cancelled = true;
      media.revert();
    };
  }, [step, isEmpty]);

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const applyPromo = () => {
    if (!promoInput.trim()) return;
    const promo = lookupPromo(promoInput);
    if (promo) {
      setPromoCode(promo.code);
      setPromoMessage({ ok: true, text: `${promo.label} applied` });
    } else {
      setPromoCode(null);
      setPromoMessage({ ok: false, text: "That code isn't valid." });
    }
  };

  const goTo = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const deliveryAddress = [
      form.street.trim(),
      form.unit.trim(),
      `${form.city.trim()}, ${form.state} ${form.zip.trim()}`,
      "United States",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.fullName,
          customerEmail: form.email,
          customerPhone: form.phone,
          deliveryAddress,
          paymentMethod,
          promoCode: trade ? null : promoCode,
          notes: form.notes,
          tradeAccountCode: trade?.code,
          companyName: isBusiness ? companyName : undefined,
          poNumber: isBusiness ? poNumber : undefined,
          items: items.map((item) => ({ productId: item.id, productName: item.name, quantity: item.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "We couldn't place your order. Please try again.");
      }
      setPlacedOrder(data.order);
      clearCart();
      goTo("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "We couldn't place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = (
    <dl className="text-base">
      <div className="flex justify-between gap-4 border-t border-forest-950/15 py-3.5">
        <dt className="text-forest-900/70">
          Subtotal ({count} {count === 1 ? "item" : "items"})
        </dt>
        <dd className="font-bold">{formatUSD(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between gap-4 border-t border-forest-950/15 py-3.5 text-secondary-deep">
          <dt>Discount ({totals.promo?.code})</dt>
          <dd className="font-bold">−{formatUSD(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4 border-t border-forest-950/15 py-3.5">
        <dt className="text-forest-900/70">Shipping</dt>
        <dd className="font-bold">{totals.shipping === 0 ? "Free" : formatUSD(totals.shipping)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-forest-950/15 py-3.5">
        <dt className="text-forest-900/70">Sales tax</dt>
        <dd className="text-right text-forest-900/60">Calculated before payment</dd>
      </div>
      <div className="flex items-end justify-between gap-4 border-t-2 border-forest-950 pt-5">
        <dt className="pb-1 font-extrabold">
          Total <span className="block text-sm font-medium text-forest-900/60">before tax</span>
        </dt>
        <dd className={`${heading} text-5xl`}>{formatUSD(totals.total)}</dd>
      </div>
    </dl>
  );

  if (step === "success" && placedOrder) {
    const method = PAYMENT_METHODS.find((m) => m.id === placedOrder.paymentMethod);
    return (
      <main ref={rootRef as React.Ref<HTMLElement>} className="overflow-x-clip bg-beige-50 text-forest-950">
        <section className="bg-forest-950 text-beige-50">
          <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 lg:px-12 lg:pb-20 lg:pt-28">
            <p data-cart-in className="text-base font-extrabold text-beige-300">Order {placedOrder.orderNumber}</p>
            <h1 key="success" data-cart-title className={`${heading} mt-4 max-w-5xl text-[clamp(3rem,8vw,7.5rem)]`}>
              Thank you, {placedOrder.customerName.split(" ")[0]}<span className="text-beige-300">.</span>
            </h1>
            <p data-cart-in className="mt-8 max-w-2xl text-lg leading-relaxed text-beige-100/75 sm:text-xl">
              We&apos;ve received your order and will be in touch at{" "}
              <strong className="font-extrabold text-beige-50">{placedOrder.customerEmail}</strong>. {method?.description}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <dl className="text-lg">
            <div data-cart-in className="flex justify-between gap-6 border-t border-forest-950/15 py-5">
              <dt className="text-forest-900/70">Ship to</dt>
              <dd className="max-w-[60%] text-right font-bold">{placedOrder.deliveryAddress}</dd>
            </div>
            <div data-cart-in className="flex justify-between gap-6 border-t border-forest-950/15 py-5">
              <dt className="text-forest-900/70">Payment</dt>
              <dd className="font-bold">{method?.label || placedOrder.paymentMethod}</dd>
            </div>
            <div data-cart-in className="flex items-end justify-between gap-6 border-t-2 border-forest-950 pt-6">
              <dt className="font-extrabold">Order total</dt>
              <dd className={`${heading} text-5xl`}>{formatUSD(placedOrder.totalAmountUSD)}</dd>
            </div>
          </dl>
          <div data-cart-in className="mt-14">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-secondary px-8 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main ref={rootRef as React.Ref<HTMLElement>} className="flex min-h-[80vh] items-center overflow-x-clip bg-forest-950 text-beige-50">
        <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <h1 key="empty" data-cart-title className={`${heading} max-w-5xl text-[clamp(3rem,9vw,8.5rem)]`}>
            Your cart is empty<span className="text-beige-300">.</span>
          </h1>
          <p data-cart-in className="mt-8 max-w-lg text-lg leading-relaxed text-beige-100/75 sm:text-xl">
            Beans, extracts, powder and more are waiting in the shop.
          </p>
          <div data-cart-in className="mt-12 flex flex-wrap items-center gap-8">
            <Link
              href="/shop"
              className="rounded-full bg-secondary px-8 py-4 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
            >
              Shop vanilla
            </Link>
            <Link
              href="/our-vanilla"
              className="border-b-2 border-secondary pb-1 text-sm font-extrabold text-secondary transition-colors hover:border-beige-50 hover:text-beige-50"
            >
              Read our story
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip bg-beige-50 pb-28 text-forest-950 lg:pb-0">
      <section className="bg-forest-950 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-14 lg:pt-24">
          <h1 key={step} data-cart-title className={`${heading} text-[clamp(3rem,8vw,7.5rem)]`}>
            {step === "checkout" ? "Checkout" : "Your cart"}
            <span className="text-beige-300">.</span>
          </h1>

          {/* Free-shipping progress */}
          <div data-cart-in className="mt-10 max-w-xl">
            <p className="text-base font-bold">
              {amountToFreeShipping <= 0
                ? "You've unlocked free shipping."
                : `Add ${formatUSD(amountToFreeShipping)} more for free shipping.`}
            </p>
            <div className="mt-3 h-1 bg-white/15" aria-hidden="true">
              <div className="h-full bg-beige-200 transition-[width] duration-700" style={{ width: `${shippingProgress}%` }} />
            </div>
          </div>
        </div>

        <ol className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl gap-x-10 px-5 sm:px-8 lg:px-12">
            {(
              [
                ["bag", "Cart"],
                ["checkout", "Shipping & payment"],
              ] as const
            ).map(([id, label]) => (
              <li key={id}>
                <button
                  onClick={() => goTo(id)}
                  aria-current={step === id ? "step" : undefined}
                  className={`block border-b-4 py-5 text-base font-black tracking-[-0.03em] transition-colors sm:text-lg ${
                    step === id ? "border-secondary text-beige-50" : "border-transparent text-beige-50/40 hover:text-beige-50"
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </div>
        </ol>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {step === "bag" ? (
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_400px] lg:gap-20">
            <div>
              <div data-cart-in className="flex items-baseline justify-between pb-5">
                <h2 data-no-reveal className="text-lg font-extrabold">
                  {count} {count === 1 ? "item" : "items"}
                </h2>
                <button onClick={clearCart} className="text-sm font-bold text-forest-900/60 transition-colors hover:text-red-600">
                  Clear cart
                </button>
              </div>

              <ul>
                {items.map((item) => (
                  <li key={item.id} data-cart-in className="relative flex gap-5 py-7 sm:gap-7">
                    <span data-cart-line className="absolute inset-x-0 top-0 h-px origin-left bg-forest-950/20" />
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white sm:h-32 sm:w-32">
                      <ProductImage src={item.image} alt={item.name} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-forest-900/50">{item.category}</p>
                          <h3 className="mt-1 text-xl font-black leading-tight tracking-[-0.03em] sm:text-2xl">{item.name}</h3>
                          <p className="mt-1.5 text-sm text-forest-900/65">
                            {item.size ? `${formatSize(item.size)} · ` : ""}
                            {formatUSD(linePrice(item).price)} each
                            {linePrice(item).source !== "retail" && (
                              <>
                                {" "}
                                <span className="line-through">{formatUSD(item.numericPrice)}</span>{" "}
                                <span className="font-extrabold text-secondary-deep">
                                  {linePrice(item).source === "trade" ? "Trade price" : "Volume price"}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-xl font-black tracking-[-0.03em] sm:text-2xl">
                          {formatUSD(linePrice(item).price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 border-b-2 border-forest-950/15">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center transition-colors hover:text-forest-600"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-8 text-center text-lg font-black tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={typeof item.stockQuantity === "number" && item.quantity >= item.stockQuantity}
                            className="flex h-10 w-10 items-center justify-center transition-colors hover:text-forest-600 disabled:opacity-30"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-sm font-bold text-forest-900/50 transition-colors hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <span className="block h-px bg-forest-950/20" />
              <Link href="/shop" className={`${textLink} mt-8 inline-block text-sm`}>
                Keep shopping
              </Link>
            </div>

            <aside data-cart-in className="lg:sticky lg:top-24">
              <h2 data-no-reveal className={`${heading} text-4xl`}>Order summary</h2>

              <div className="mt-8 border-t border-forest-950/15 py-5">
                {trade ? (
                  <div className="text-base">
                    <p className="font-extrabold text-forest-950">Trade account verified</p>
                    <p className="mt-1 text-forest-900/70">{trade.account.companyName} · trade prices applied</p>
                    <button onClick={clearTrade} className="mt-2 text-sm font-bold text-forest-900/60 underline underline-offset-4">
                      Remove
                    </button>
                  </div>
                ) : (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-base font-extrabold [&::-webkit-details-marker]:hidden">
                      Have a trade account?
                      <span aria-hidden className="text-2xl font-light leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      <input
                        aria-label="Trade account code"
                        value={tradeCode}
                        onChange={(e) => setTradeCode(e.target.value)}
                        placeholder="Account code, e.g. IKT-XXXXXX"
                        className={`${inputClass} uppercase`}
                      />
                      <input
                        aria-label="Account email"
                        type="email"
                        value={tradeEmail}
                        onChange={(e) => setTradeEmail(e.target.value)}
                        placeholder="Email on the account"
                        className={inputClass}
                      />
                      <button
                        onClick={verifyTradeAccount}
                        disabled={isVerifying || !tradeCode.trim() || !tradeEmail.trim()}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-forest-950 text-sm font-extrabold transition-colors hover:bg-forest-950 hover:text-beige-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-forest-950"
                      >
                        {isVerifying && <Loader2 size={14} className="animate-spin" />} Apply trade pricing
                      </button>
                      {tradeError && <p className="text-sm font-semibold text-red-600">{tradeError}</p>}
                      <p className="text-sm text-forest-900/65">
                        No account yet? <a href="/wholesale#apply" className="font-bold text-forest-950 underline underline-offset-4">Apply here</a>.
                      </p>
                    </div>
                  </details>
                )}
              </div>

              {!trade && (
                <div className="border-t border-forest-950/15 py-5">
                  <label htmlFor="promo" className={labelClass}>
                    Promo code
                  </label>
                  <div className="flex items-end gap-4">
                    <input
                      id="promo"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Enter code"
                      className={`${inputClass} flex-1 uppercase`}
                    />
                    <button onClick={applyPromo} className={`${textLink} mb-2 text-sm`}>
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`mt-2 text-sm font-bold ${promoMessage.ok ? "text-secondary-deep" : "text-red-600"}`}>
                      {promoMessage.text}
                    </p>
                  )}
                </div>
              )}

              {summary}

              <button onClick={() => goTo("checkout")} className={`${primaryButton} mt-8`}>
                Continue to checkout
              </button>
            </aside>
          </div>
        ) : (
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrder}
            className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_400px] lg:gap-20"
          >
            <div className="space-y-14">
              <fieldset data-cart-in>
                <legend className="sr-only">Purchase type</legend>
                <div className="flex gap-x-10">
                  {(
                    [
                      [false, "Personal"],
                      [true, "Business"],
                    ] as const
                  ).map(([business, text]) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => {
                        if (business) setIsBusiness(true);
                        else if (!trade) setIsBusiness(false);
                      }}
                      aria-pressed={isBusiness === business}
                      className={`border-b-4 pb-2 text-[clamp(1.75rem,3vw,2.5rem)] font-black leading-none tracking-[-0.04em] transition-colors ${
                        isBusiness === business ? "border-secondary text-forest-950" : "border-transparent text-forest-950/30 hover:text-forest-950/60"
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                {isBusiness && (
                  <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyName" className={labelClass}>Company name *</label>
                      <input
                        id="companyName"
                        required
                        autoComplete="organization"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        readOnly={Boolean(trade)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="poNumber" className={labelClass}>PO number</label>
                      <input id="poNumber" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputClass} />
                    </div>
                    {!trade && (
                      <p className="text-sm text-forest-900/65 sm:col-span-2">
                        Have a trade account? Enter your code in the cart summary for trade pricing and invoice terms, or{" "}
                        <a href="/wholesale#apply" className="font-bold text-forest-950 underline underline-offset-4">apply for one</a>.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              <fieldset data-cart-in className="border-t border-forest-950/15 pt-10">
                <legend className="sr-only">Contact</legend>
                <h2 data-no-reveal aria-hidden className={`${heading} text-4xl`}>Contact</h2>
                <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className={labelClass}>Full name *</label>
                    <input id="fullName" required autoComplete="name" value={form.fullName} onChange={update("fullName")} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={update("email")}
                      readOnly={Boolean(trade)}
                      className={inputClass}
                    />
                    {trade && <span className="mt-1.5 block text-sm text-forest-900/60">Must match your trade account.</span>}
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>Phone *</label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="(555) 123-4567"
                      pattern="(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}"
                      title="10-digit US phone number, e.g. (555) 123-4567"
                      aria-describedby="phone-hint"
                      value={form.phone}
                      onChange={update("phone")}
                      onBlur={() => setForm((f) => ({ ...f, phone: formatUSPhone(f.phone) }))}
                      className={inputClass}
                    />
                    <span id="phone-hint" className="mt-1.5 block text-sm text-forest-900/60">
                      Used only for questions about your order or delivery.
                    </span>
                  </div>
                </div>
              </fieldset>

              <fieldset data-cart-in className="border-t border-forest-950/15 pt-10">
                <legend className="sr-only">Shipping address</legend>
                <h2 data-no-reveal aria-hidden className={`${heading} text-4xl`}>Shipping address</h2>
                <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-[1.4fr_1fr_0.8fr]">
                  <div className="sm:col-span-3">
                    <label htmlFor="street" className={labelClass}>Street address *</label>
                    <input id="street" required autoComplete="address-line1" value={form.street} onChange={update("street")} className={inputClass} />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="unit" className={labelClass}>Apartment, suite, etc.</label>
                    <input id="unit" autoComplete="address-line2" value={form.unit} onChange={update("unit")} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="city" className={labelClass}>City *</label>
                    <input id="city" required autoComplete="address-level2" value={form.city} onChange={update("city")} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>State *</label>
                    <select id="state" required autoComplete="address-level1" value={form.state} onChange={update("state")} className={inputClass}>
                      <option value="">Select</option>
                      {US_STATES.map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="zip" className={labelClass}>ZIP *</label>
                    <input
                      id="zip"
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      pattern="\d{5}(-\d{4})?"
                      title="5-digit ZIP code, or ZIP+4 (e.g. 60435 or 60435-1234)"
                      maxLength={10}
                      value={form.zip}
                      onChange={update("zip")}
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset data-cart-in className="border-t border-forest-950/15 pt-10">
                <legend className="sr-only">Payment</legend>
                <h2 data-no-reveal aria-hidden className={`${heading} text-4xl`}>Payment</h2>
                <p className="mt-4 max-w-xl text-base text-forest-900/70">
                  You won&apos;t be charged now. We confirm stock, then send payment details by email.
                </p>
                <div className="mt-8">
                  {availableMethods.map((method) => {
                    const selected = paymentMethod === method.id;
                    return (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-start gap-4 border-t border-forest-950/15 py-5 pl-4 transition-colors ${
                          selected ? "border-l-4 border-l-secondary bg-secondary-light/50" : "border-l-4 border-l-transparent hover:bg-beige-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selected}
                          onChange={() => setPaymentMethod(method.id)}
                          className="mt-1.5 h-4 w-4 shrink-0 accent-forest-950"
                        />
                        <span>
                          <span className="block text-lg font-black tracking-[-0.02em]">{method.label}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-forest-900/65">{method.description}</span>
                        </span>
                      </label>
                    );
                  })}
                  <span className="block h-px bg-forest-950/15" />
                </div>
              </fieldset>

              <div data-cart-in className="border-t border-forest-950/15 pt-10">
                <label htmlFor="notes" className={labelClass}>Order notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={update("notes")}
                  placeholder="Gift message, delivery instructions, wholesale account number…"
                  className={`${inputClass} h-auto resize-y py-3`}
                />
              </div>
            </div>

            <aside data-cart-in className="lg:sticky lg:top-24">
              <h2 data-no-reveal className={`${heading} text-4xl`}>Review</h2>
              <ul className="mt-8">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 border-t border-forest-950/15 py-4 text-base">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                      <ProductImage src={item.image} alt={item.name} />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold">{item.name}</span>
                      <span className="text-sm text-forest-900/60">Qty {item.quantity}</span>
                    </span>
                    <span className="font-bold">{formatUSD(linePrice(item).price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              {summary}

              {submitError && (
                <p role="alert" className="mt-6 border-l-4 border-red-600 pl-4 text-sm font-semibold text-red-700">
                  {submitError}
                </p>
              )}

              <p className="mt-6 text-sm leading-relaxed text-forest-900/65">
                By placing your order you agree to our{" "}
                <Link href="/terms" className="font-bold text-forest-950 underline underline-offset-4">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/shipping-returns" className="font-bold text-forest-950 underline underline-offset-4">Shipping &amp; Returns policy</Link>,
                and acknowledge our{" "}
                <Link href="/privacy" className="font-bold text-forest-950 underline underline-offset-4">Privacy Policy</Link>.
                You&rsquo;ll receive a payment link with applicable sales tax before you&rsquo;re charged.
              </p>

              <button type="submit" disabled={isSubmitting} className={`${primaryButton} mt-8`}>
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Placing order…" : `Place order · ${formatUSD(totals.total)}`}
              </button>
              <button
                type="button"
                onClick={() => goTo("bag")}
                className="mt-5 w-full text-center text-sm font-bold text-forest-900/60 transition-colors hover:text-forest-950"
              >
                Back to cart
              </button>
            </aside>
          </form>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-950/10 bg-beige-50/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <span className="block text-xs font-bold text-forest-900/60">Total</span>
            <span className="block text-2xl font-black tracking-[-0.04em]">{formatUSD(totals.total)}</span>
          </div>
          {step === "bag" ? (
            <button
              onClick={() => goTo("checkout")}
              className="rounded-full bg-secondary px-6 py-3.5 text-sm font-extrabold text-forest-950 transition-colors hover:bg-secondary-dark"
            >
              Checkout
            </button>
          ) : (
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-secondary px-6 py-3.5 text-sm font-extrabold text-forest-950 disabled:opacity-60 transition-colors hover:bg-secondary-dark"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Place order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
