"use client";

import { useState } from "react";
import { savePrivacyPrefs, useGlobalPrivacyControl, usePrivacyPrefs } from "@/lib/privacy";

function Switch({
  id,
  checked,
  disabled,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-8 border-t border-forest-950/15 py-7">
      <div>
        <label htmlFor={id} className="block text-xl font-black leading-tight tracking-[-0.03em] text-forest-950 sm:text-2xl">
          {label}
        </label>
        <p id={`${id}-desc`} className="mt-2 max-w-xl text-base leading-relaxed text-forest-900/70">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "border-forest-950 bg-forest-950" : "border-forest-950/30 bg-beige-200"
        }`}
      >
        <span className="sr-only">{checked ? "On" : "Off"}</span>
        <span
          aria-hidden
          className={`inline-block h-6 w-6 rounded-full shadow transition-[translate,background-color] ${
            checked ? "bg-secondary" : "bg-white"
          } ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function PrivacyChoicesForm() {
  const prefs = usePrivacyPrefs();
  const gpc = useGlobalPrivacyControl();
  const [status, setStatus] = useState<string | null>(null);

  const save = (update: Parameters<typeof savePrivacyPrefs>[0], message: string) => {
    savePrivacyPrefs({ ...update, noticeDismissed: true });
    setStatus(message);
  };

  return (
    <div>
      {gpc && (
        <p className="mb-8 border-l-4 border-beige-400 pl-5 text-base leading-relaxed text-forest-950">
          <strong className="font-extrabold">Global Privacy Control detected.</strong> Your browser is sending a Global Privacy Control signal. We&rsquo;re honoring it: optional analytics are off
          and you&rsquo;re opted out of any sale or sharing. To change this, turn off GPC in your browser.
        </p>
      )}

      <Switch
        id="choice-analytics"
        label="Optional analytics"
        description="Anonymous page-speed and reliability measurement that helps us improve the store. Essential cookies for your cart and checkout always stay on."
        checked={prefs.analytics}
        disabled={gpc}
        onChange={(value) =>
          save({ analytics: value }, value ? "Optional analytics turned on." : "Optional analytics turned off.")
        }
      />

      <Switch
        id="choice-sale-share"
        label="Do Not Sell or Share My Personal Information"
        description="We don't sell or share personal information for targeted advertising. Turn this on to record your opt-out, and we'll apply it if our practices ever change."
        checked={prefs.optOutSaleShare}
        disabled={gpc}
        onChange={(value) =>
          save(
            value ? { optOutSaleShare: true, analytics: false } : { optOutSaleShare: false },
            value ? "Opt-out recorded. Optional analytics are also off." : "Opt-out removed."
          )
        }
      />

      <p
        role="status"
        aria-live="polite"
        className="min-h-6 border-t border-forest-950/15 pt-5 text-base font-extrabold text-secondary-deep"
      >
        {status}
      </p>
    </div>
  );
}
