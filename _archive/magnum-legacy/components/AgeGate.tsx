"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Wine, AlertCircle, RefreshCw, Check } from "lucide-react";

export function AgeGate() {
  const [mounted, setMounted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [underage, setUnderage] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem("ikfoods_age_verified");
    if (isVerified === "true") {
      setVerified(true);
    }
    setMounted(true);
  }, []);

  if (!mounted || verified) {
    return null;
  }

  const handleConfirmAge = () => {
    localStorage.setItem("ikfoods_age_verified", "true");
    document.cookie = "ikfoods_age_verified=true; Max-Age=31536000; Path=/; SameSite=Lax";
    setVerified(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ikfoods:age-verified"));
    }
  };

  const handleDenyAge = () => {
    setUnderage(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 select-none animate-fadeIn font-sans">
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 sm:p-10 text-center text-neutral-900 shadow-2xl space-y-6">
        
        {/* Brand Header matching BrandsShelf typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 bg-beige-50 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-forest-700">
            <ShieldCheck size={13} className="text-forest-600" />
            <span>Age Verification Required</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-neutral-900 uppercase">
            MAGNUM<span className="text-forest-700">.</span>
          </h2>
          <p className="font-serif text-xs font-medium uppercase tracking-[0.2em] text-forest-700">
            FINE WINE & SPIRITS
          </p>
        </div>

        {underage ? (
          /* Underage Access Restriction View */
          <div className="space-y-5 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-light text-neutral-900">Access Restricted</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Sorry, you must be 18 years of age or older to view and purchase products from Magnum Liquors.
              </p>
            </div>

            <button
              onClick={() => setUnderage(false)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-forest-700 hover:underline pt-2 font-sans"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : (
          /* Verification Prompt View */
          <>
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-beige-50 border border-beige-200 text-forest-700">
                <Wine size={22} />
              </div>

              <h3 className="font-serif text-2xl font-light text-neutral-900">
                Are you 18 years or older?
              </h3>

              <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto font-sans">
                Please confirm that you are at least 18 years of age to proceed into our fine spirits collection.
              </p>
            </div>

            {/* Decision Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleConfirmAge}
                className="w-full rounded-full bg-forest-900 hover:bg-forest-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition shadow-md flex items-center justify-center gap-2 font-sans"
              >
                <Check size={15} /> Yes, I am 18 or older
              </button>

              <button
                onClick={handleDenyAge}
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 font-sans"
              >
                No, I am under 18
              </button>
            </div>

            <p className="text-[10px] text-neutral-400 font-light font-sans">
              Thoughtfully Sourced · Enjoy Responsibly · 18+ Required
            </p>
          </>
        )}

      </div>
    </div>
  );
}