"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Gift,
  HelpCircle,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCart } from "./CartContext";
import { formatUGX } from "@/utils/currency";
import { FastVideo, isVideoMedia } from "./FastVideo";

const FREE_DELIVERY_THRESHOLD_USD = 150;

const KAMPALA_NEIGHBORHOODS = [
  "Kololo",
  "Nakasero",
  "Naguru",
  "Bugolobi",
  "Muyenga",
  "Ntinda",
  "Acacia / Kamwokya",
  "Entebbe Road",
  "Munyoonyo",
];

export function Cart({
  count,
  open,
  onClose,
}: {
  count: number;
  open: boolean;
  onClose: () => void;
}) {
  const isDark = false;

  const {
    items,
    subtotal,
    estimatedTax,
    grandTotal: initialGrandTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();


  // Multi-step Checkout State
  const [step, setStep] = useState<"bag" | "checkout" | "success">("bag");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Gift Wrap Option
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftNote, setGiftNote] = useState("");

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash on Delivery" | "MTN Mobile Money" | "Airtel Money" | "Visa / Mastercard">("Cash on Delivery");
  const [orderNumber, setOrderNumber] = useState("");

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Free delivery progress calculation
  const deliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD_USD) * 100));
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_USD - subtotal);

  // Discount Calculation
  const discountAmount = Math.round(subtotal * appliedDiscount);
  const calculatedGrandTotal = Math.max(0, initialGrandTotal - discountAmount);

  const handleApplyPromo = () => {
    setPromoError(null);
    setPromoSuccess(null);
    const clean = promoCode.trim().toUpperCase();

    if (!clean) return;

    if (clean === "MAGNUM10" || clean === "VIP2026") {
      setAppliedDiscount(0.10);
      setPromoSuccess("10% Sommelier VIP Discount Applied!");
    } else if (clean === "FIRSTORDER" || clean === "WELCOME") {
      setAppliedDiscount(0.05);
      setPromoSuccess("5% Welcome Discount Applied!");
    } else {
      setPromoError("Invalid code. Try 'MAGNUM10' or 'VIP2026'");
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    setStep("checkout");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !address) return;

    setIsSubmitting(true);

    const generatedOrderNum = `MAG-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderNumber(generatedOrderNum);

    const totalUGX = Math.round(calculatedGrandTotal * 3700);
    const systemCommUSD = Number((calculatedGrandTotal * 0.10).toFixed(2));
    const systemCommUGX = Math.round(totalUGX * 0.10);
    const netPayoutUSD = Number((calculatedGrandTotal * 0.90).toFixed(2));
    const netPayoutUGX = Math.round(totalUGX * 0.90);

    const formattedAddress = deliveryInstructions
      ? `${address} (Note: ${deliveryInstructions})`
      : address;

    const orderPayload = {
      orderNumber: generatedOrderNum,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      deliveryAddress: formattedAddress,
      orderStatus: "Pending",
      paymentMethod,
      paymentStatus: "Pending",
      totalAmountUSD: calculatedGrandTotal,
      totalAmountUGX: totalUGX,
      commissionRate: 0.10,
      systemCommissionUSD: systemCommUSD,
      systemCommissionUGX: systemCommUGX,
      netPayoutUSD,
      netPayoutUGX,
      items: items.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        unitPriceUSD: item.numericPrice,
        subtotalUSD: item.numericPrice * item.quantity,
      })),
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      console.warn("Order submission error:", err);
    }

    // Save order locally for instantaneous dashboard synchronization
    const newPlacedOrder = {
      id: String(Date.now()),
      orderNumber: generatedOrderNum,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      deliveryAddress: formattedAddress,
      orderStatus: "Pending",
      paymentMethod,
      paymentStatus: "Pending",
      totalAmountUSD: calculatedGrandTotal,
      totalAmountUGX: totalUGX,
      commissionRate: 0.10,
      systemCommissionUSD: systemCommUSD,
      systemCommissionUGX: systemCommUGX,
      netPayoutUSD,
      netPayoutUGX,
      priority: "High",
      items: items.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        unitPriceUSD: item.numericPrice,
        subtotalUSD: item.numericPrice * item.quantity,
      })),
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    try {
      const existingRaw = localStorage.getItem("ikfoods_placed_orders");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem("ikfoods_placed_orders", JSON.stringify([newPlacedOrder, ...existing]));
      localStorage.setItem("ikfoods_pending_order_notification", JSON.stringify(newPlacedOrder));
    } catch (e) {
      console.warn("Failed to save placed order locally:", e);
    }

    setIsSubmitting(false);
    clearCart();
    setStep("success");
  };

  const handleResetCartModal = () => {
    setStep("bag");
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setDeliveryInstructions("");
    setAppliedDiscount(0);
    setPromoCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      />

      <aside
        className={`relative z-10 flex h-full w-full max-w-lg flex-col justify-between border-l shadow-2xl transition-all duration-300 ${
          isDark
            ? "border-white/10 bg-forest-950 text-[#FAF7F2]"
            : "border-neutral-200/90 bg-[#fbfbfa] text-neutral-900"
        }`}
        aria-label="Shopping bag and checkout drawer"
      >
        {/* TOP HEADER & MULTI-STEP PROGRESS TABS */}
        <div
          className={`shrink-0 border-b px-6 py-4 ${
            isDark ? "border-white/10 bg-forest-900" : "border-neutral-200/80 bg-white"
          }`}
        >
          {/* Brand & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                  isDark
                    ? "border-forest-700/40 bg-forest-900 text-secondary"
                    : "border-beige-200 bg-beige-50 text-forest-700"
                }`}
              >
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className={`font-serif text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
                  {step === "checkout" ? "Express Checkout" : step === "success" ? "Order Confirmed" : "Your Cellar Bag"}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-700">
                  Magnum Fine Wine & Spirits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {step === "bag" && count > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-red-500 transition px-2 py-1"
                >
                  Clear Bag
                </button>
              )}
              <button
                aria-label="Close cart"
                onClick={handleResetCartModal}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  isDark
                    ? "text-neutral-400 hover:bg-white/10 hover:text-white"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stepper Navigation Pills */}
          {step !== "success" && (
            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 border-inherit">
              {[
                { id: "bag", label: "1. Cellar Bag", icon: ShoppingBag },
                { id: "checkout", label: "2. Delivery & Pay", icon: Truck },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                return (
                  <div
                    key={s.id}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-1.5 text-xs font-bold transition ${
                      isActive
                        ? isDark
                          ? "bg-[#1f1b16] text-secondary border border-forest-700/40 shadow-xs"
                          : "bg-beige-50 text-forest-700 border border-beige-200 shadow-xs"
                        : isDark
                        ? "text-neutral-500"
                        : "text-neutral-400"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* FREE EXPRESS DELIVERY PROGRESS BAR */}
          {step === "bag" && items.length > 0 && (
            <div className="mt-3 rounded-2xl p-3 border border-inherit bg-inherit/40 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-forest-700">
                  <Truck size={13} />
                  {amountNeededForFreeDelivery <= 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Unlocked Free VIP Express Delivery!</span>
                  ) : (
                    <span>Add {formatUGX(amountNeededForFreeDelivery)} more for Free Express Delivery</span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-neutral-400">{deliveryProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-forest-700 to-secondary transition-all duration-500 rounded-full"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 1: CELLAR BAG ITEMS VIEW */}
        {step === "bag" && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Scrollable Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 scrollbar-none">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-16 space-y-4">
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border shadow-xs ${
                      isDark ? "border-white/10 bg-forest-900 text-secondary" : "border-neutral-200 bg-white text-forest-700"
                    }`}
                  >
                    <ShoppingBag size={36} />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h3 className={`font-serif text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                      Your cellar bag is empty
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                      Explore our curated single malts, prestige champagnes, and artisanal spirits to add bottles.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 rounded-full bg-forest-900 hover:bg-forest-800 px-6 py-2.5 text-xs font-bold text-white transition shadow-sm"
                  >
                    Start Exploring Bottles
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative flex items-center gap-4 rounded-3xl border p-4 transition-all duration-200 ${
                      isDark
                        ? "border-white/10 bg-forest-900 hover:border-forest-700/40 shadow-xs"
                        : "border-neutral-200/80 bg-white hover:border-neutral-300 shadow-xs"
                    }`}
                  >
                    {/* Bottle Thumbnail (Image or Video) */}
                    <div
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border p-2 flex items-center justify-center ${
                        isDark ? "border-white/10 bg-forest-950" : "border-neutral-100 bg-neutral-50"
                      }`}
                    >
                      {isVideoMedia(item.image) ? (
                        <FastVideo
                          src={item.image}
                          autoPlay
                          loop
                          muted
                          objectFit="contain"
                          className="h-full w-full rounded-xl"
                        />
                      ) : (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Bottle Info */}
                    <div className="flex-1 min-w-0 pr-6 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                        {item.producer}{item.volume ? ` · ${item.volume}` : ""}
                      </span>
                      <h4 className={`font-serif text-sm font-bold truncate ${isDark ? "text-white" : "text-neutral-900"}`}>
                        {item.name}
                      </h4>
                      <p className="font-sans text-xs font-bold text-neutral-400">
                        {formatUGX(item.numericPrice)} <span className="font-normal text-[10px]">/ bottle</span>
                      </p>
                    </div>

                    {/* Quantity Selector & Item Subtotal */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`font-sans text-sm font-extrabold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
                        {formatUGX(item.numericPrice * item.quantity)}
                      </span>

                      <div
                        className={`flex items-center gap-1.5 rounded-full border p-1 text-xs shadow-2xs ${
                          isDark ? "border-white/15 bg-forest-900" : "border-neutral-200 bg-neutral-50"
                        }`}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease bottle quantity"
                          className={`h-7 w-7 flex items-center justify-center rounded-full transition active:scale-90 font-bold ${
                            isDark
                              ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                              : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                          }`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className={`min-w-[18px] text-center font-sans text-xs font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase bottle quantity"
                          className={`h-7 w-7 flex items-center justify-center rounded-full transition active:scale-90 font-bold ${
                            isDark
                              ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                              : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Item Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from bag`}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-red-500 transition opacity-80 hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Invoice & Summary Bar */}
            {items.length > 0 && (
              <div
                className={`shrink-0 border-t p-6 space-y-4 ${
                  isDark ? "border-white/10 bg-forest-900" : "border-neutral-200/80 bg-white"
                }`}
              >
                {/* Promo Code Accordion */}
                <div>
                  {!showPromoInput ? (
                    <button
                      onClick={() => setShowPromoInput(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:underline"
                    >
                      <Tag size={13} /> Have a sommelier promo or VIP code?
                    </button>
                  ) : (
                    <div className="space-y-1.5 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="e.g. MAGNUM10 or VIP2026"
                          className={`h-9 flex-1 rounded-xl border px-3 text-xs uppercase font-mono outline-none ${
                            isDark
                              ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                              : "border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-forest-700"
                          }`}
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="h-9 rounded-xl bg-forest-900 hover:bg-forest-800 px-4 text-xs font-bold text-white transition"
                        >
                          Apply
                        </button>
                      </div>
                      {promoSuccess && <p className="text-[11px] font-bold text-emerald-500">{promoSuccess}</p>}
                      {promoError && <p className="text-[11px] font-semibold text-red-500">{promoError}</p>}
                    </div>
                  )}
                </div>

                {/* Calculation Breakdown Card */}
                <div
                  className={`rounded-2xl border p-4 space-y-2 text-xs ${
                    isDark ? "border-white/10 bg-forest-900 text-neutral-300" : "border-neutral-200/70 bg-neutral-50 text-neutral-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Receipt size={13} className="text-forest-700" /> Bottles Subtotal ({count})
                    </span>
                    <span className={`font-sans font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                      {formatUGX(subtotal)}
                    </span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-500 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Tag size={13} /> VIP Promo Discount ({(appliedDiscount * 100)}%)
                      </span>
                      <span>-{formatUGX(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Truck size={13} className="text-forest-700" /> Climate-Controlled Delivery
                    </span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      FREE EXPRESS
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Estimated Tax & Vault Fees</span>
                    <span className={`font-sans font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                      {formatUGX(estimatedTax)}
                    </span>
                  </div>

                  <div className="border-t pt-2 flex items-center justify-between border-inherit">
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>Total Due</span>
                    <span className="font-sans text-xl font-extrabold text-forest-700">
                      {formatUGX(calculatedGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full rounded-full bg-forest-900 hover:bg-forest-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Delivery & Payment</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CHECKOUT & DELIVERY DETAILS */}
        {step === "checkout" && (
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none">
              
              {/* Delivery Contact Info */}
              <div className="space-y-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-secondary" : "text-forest-700"}`}>
                  1. Recipient & Contact Info
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <User size={14} className="absolute left-3.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Brenda Namuli"
                        className={`w-full h-10 rounded-2xl border pl-9 pr-4 text-xs outline-none transition ${
                          isDark
                            ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                            : "border-neutral-200 bg-white text-neutral-900 focus:border-forest-700"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-400 block mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={14} className="absolute left-3.5 text-neutral-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@domain.com"
                          className={`w-full h-10 rounded-2xl border pl-9 pr-4 text-xs outline-none transition ${
                            isDark
                              ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                              : "border-neutral-200 bg-white text-neutral-900 focus:border-forest-700"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-400 block mb-1">
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Phone size={14} className="absolute left-3.5 text-neutral-400" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+256 700 123456"
                          className={`w-full h-10 rounded-2xl border pl-9 pr-4 text-xs outline-none transition ${
                            isDark
                              ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                              : "border-neutral-200 bg-white text-neutral-900 focus:border-forest-700"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Neighborhood Selector */}
              <div className="space-y-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-secondary" : "text-forest-700"}`}>
                  2. Destination & Delivery Address
                </h3>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Quick Area Picker
                    </label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {KAMPALA_NEIGHBORHOODS.map((hood) => (
                        <button
                          type="button"
                          key={hood}
                          onClick={() => setAddress((prev) => (prev ? `${prev}, ${hood}` : `${hood}, Kampala`))}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition ${
                            address.includes(hood)
                              ? "bg-forest-900 text-white border-forest-700"
                              : isDark
                              ? "border-white/10 bg-forest-900 text-neutral-300 hover:border-forest-700"
                              : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                          }`}
                        >
                          + {hood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Delivery Address Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Acacia Avenue, Kololo, Kampala"
                      className={`w-full rounded-2xl border p-3 text-xs outline-none transition ${
                        isDark
                          ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                          : "border-neutral-200 bg-white text-neutral-900 focus:border-forest-700"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Delivery Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Leave at security reception / call upon arrival"
                      className={`w-full h-10 rounded-2xl border px-3.5 text-xs outline-none transition ${
                        isDark
                          ? "border-white/15 bg-forest-900 text-white focus:border-forest-700"
                          : "border-neutral-200 bg-white text-neutral-900 focus:border-forest-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Option */}
              <div className="space-y-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-secondary" : "text-forest-700"}`}>
                  3. Payment Method
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "Cash on Delivery", label: "Cash on Delivery", desc: "Pay upon bottle arrival", icon: Zap },
                    { id: "MTN Mobile Money", label: "MTN MoMo", desc: "Prompt sent to phone", icon: Phone },
                    { id: "Airtel Money", label: "Airtel Money", desc: "Prompt sent to phone", icon: Phone },
                    { id: "Visa / Mastercard", label: "Card on Delivery", desc: "POS mobile terminal", icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-forest-700 bg-beige-50 dark:bg-forest-900 text-forest-700 ring-1 ring-forest-700"
                            : isDark
                            ? "border-white/10 bg-forest-900 text-neutral-400 hover:border-white/20"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon size={13} />
                          <span>{m.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gift Packaging Checkbox */}
              <div className={`rounded-2xl border p-3.5 space-y-2 text-xs ${isDark ? "border-white/10 bg-forest-900" : "border-neutral-200 bg-white"}`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isGiftWrapped}
                    onChange={(e) => setIsGiftWrapped(e.target.checked)}
                    className="rounded border-neutral-300 accent-forest-700 h-4 w-4"
                  />
                  <span className="font-bold flex items-center gap-1 text-forest-700">
                    <Gift size={14} /> Complimentary Luxury Gift Packaging
                  </span>
                </label>
                {isGiftWrapped && (
                  <input
                    type="text"
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Enter custom sommelier note to recipient..."
                    className={`w-full h-9 rounded-xl border px-3 text-xs outline-none ${
                      isDark ? "border-white/15 bg-forest-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-900"
                    }`}
                  />
                )}
              </div>

            </div>

            {/* Sticky Bottom Actions */}
            <div
              className={`shrink-0 border-t p-6 space-y-3 ${
                isDark ? "border-white/10 bg-forest-900" : "border-neutral-200/80 bg-white"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-400">Total Order Amount</span>
                <span className="font-sans text-xl font-extrabold text-forest-700">
                  {formatUGX(calculatedGrandTotal)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-forest-900 hover:bg-forest-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Clock size={15} className="animate-spin" />
                    <span>Confirming & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Confirm Order — {formatUGX(calculatedGrandTotal)}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("bag")}
                className="w-full flex items-center justify-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 py-1 transition"
              >
                <ArrowLeft size={13} /> Return to Cellar Bag
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER CONFIRMED SUCCESS VIEW */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 overflow-y-auto">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-forest-900/20 blur-xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 shadow-lg">
                <CheckCircle2 size={44} />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-beige-50 dark:bg-forest-900 border border-beige-200 dark:border-forest-700/40 px-3.5 py-1 text-xs font-mono font-bold text-forest-700">
                <Receipt size={13} /> {orderNumber}
              </span>
              <h3 className={`font-serif text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
                Order Confirmed!
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Thank you <strong className={isDark ? "text-white" : "text-neutral-900"}>{fullName}</strong>. Your cellar order has been registered live and dispatched to the fulfillment team for express climate delivery.
              </p>
            </div>

            {/* Order Recap Card */}
            <div
              className={`w-full rounded-2xl border p-4 text-left space-y-2 text-xs ${
                isDark ? "border-white/10 bg-forest-900 text-neutral-300" : "border-neutral-200 bg-white text-neutral-700 shadow-xs"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-neutral-400">Delivery Address:</span>
                <span className={`font-semibold max-w-[200px] truncate text-right ${isDark ? "text-white" : "text-neutral-900"}`}>
                  {address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Payment Mode:</span>
                <span className="font-bold text-forest-700">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Est. Arrival:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <Clock size={12} /> 45–60 mins (Kampala Express)
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 border-inherit">
                <span className="font-bold">Total Settled:</span>
                <span className="font-sans font-extrabold text-forest-700">
                  {formatUGX(calculatedGrandTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetCartModal}
              className="w-full rounded-full bg-forest-900 hover:bg-forest-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition shadow-md"
            >
              Continue Exploring Cellar
            </button>
          </div>
        )}

      </aside>
    </div>
  );
}
