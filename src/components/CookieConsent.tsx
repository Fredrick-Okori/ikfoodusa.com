"use client";

import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { savePrivacyPrefs, useGlobalPrivacyControl, usePrivacyPrefs } from "@/lib/privacy";

/**
 * US-style privacy notice (notice at collection + opt-out), not an EU opt-in wall.
 * Shown once; choices live on /privacy-choices.
 */
export function CookieConsent() {
  const { noticeDismissed } = usePrivacyPrefs();
  const gpc = useGlobalPrivacyControl();

  if (noticeDismissed) return null;

  const dismiss = () => savePrivacyPrefs({ noticeDismissed: true });

  return (
    <aside
      aria-label="Privacy notice"
      className="fixed inset-x-4 bottom-4 z-[45] rounded-3xl border border-beige-50/10 bg-forest-900 p-5 text-beige-50 shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-5 sm:inset-x-auto sm:right-6 sm:max-w-md"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-beige-100 text-forest-950">
          {gpc ? <ShieldCheck size={19} aria-hidden /> : <Cookie size={19} aria-hidden />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight">Your privacy</h2>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss privacy notice"
              className="-m-2 flex h-10 w-10 items-center justify-center rounded-full text-beige-100/70 transition hover:bg-white/10 hover:text-beige-50"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-beige-100/70">
            We use essential cookies to run your cart and checkout, and optional analytics to improve the store.
            We don&rsquo;t sell your personal information.{" "}
            {gpc
              ? "We detected a Global Privacy Control signal from your browser, so optional analytics are off."
              : "You can opt out of optional analytics at any time."}{" "}
            <Link href="/privacy" className="font-semibold text-beige-50 underline decoration-secondary decoration-2 underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/privacy-choices"
          onClick={dismiss}
          className="inline-flex items-center justify-center rounded-full border border-beige-50/25 px-4 py-2.5 text-xs font-semibold text-beige-50 transition hover:bg-white/10"
        >
          Your Privacy Choices
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center justify-center rounded-full bg-secondary px-5 py-2.5 text-xs font-extrabold text-forest-950 shadow-md transition hover:bg-secondary-dark"
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
