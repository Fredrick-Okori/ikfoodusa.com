"use client";

import { useSyncExternalStore } from "react";
import { storageKey } from "@/lib/brand";

/**
 * US-style privacy choices (CCPA/CPRA and similar state laws): optional analytics are on by
 * default, and the visitor can opt out at any time. A browser Global Privacy Control (GPC)
 * signal is treated as a valid opt-out and always wins over a saved preference.
 */
export interface PrivacyPrefs {
  /** Optional analytics / performance measurement */
  analytics: boolean;
  /** Visitor has opted out of any "sale" or "sharing" of personal information */
  optOutSaleShare: boolean;
  /** The first-visit notice has been seen and dismissed */
  noticeDismissed: boolean;
}

const KEY = storageKey("privacy_choices");
/** Pre-2026 cookie-banner key; "declined" carries over as an analytics opt-out. */
const LEGACY_KEY = storageKey("cookie_consent");
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const CHANGE_EVENT = "ikfoods:privacy-change";

const DEFAULTS: PrivacyPrefs = { analytics: true, optOutSaleShare: false, noticeDismissed: false };

export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function readStored(): PrivacyPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    if (localStorage.getItem(LEGACY_KEY) === "declined") {
      return { ...DEFAULTS, analytics: false, noticeDismissed: true };
    }
    if (localStorage.getItem(LEGACY_KEY) === "accepted") return { ...DEFAULTS, noticeDismissed: true };
  } catch {
    // Storage blocked (private mode etc.) — fall through to defaults.
  }
  return DEFAULTS;
}

/** Saved preferences with GPC applied on top. */
export function getPrivacyPrefs(): PrivacyPrefs {
  const prefs = readStored();
  return hasGlobalPrivacyControl() ? { ...prefs, analytics: false, optOutSaleShare: true } : prefs;
}

export function savePrivacyPrefs(update: Partial<PrivacyPrefs>) {
  const next = { ...readStored(), ...update };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  try {
    // Mirrored to a cookie so the server could honor it later if needed.
    const flag = next.analytics && !next.optOutSaleShare ? "on" : "off";
    document.cookie = `${KEY}=${flag}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {}
  cached = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// useSyncExternalStore needs a stable snapshot object between changes.
let cached: PrivacyPrefs | null = null;
function snapshot() {
  if (!cached) cached = getPrivacyPrefs();
  return cached;
}
function subscribe(onChange: () => void) {
  const handler = () => {
    cached = null;
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
/** Server render assumes nothing optional is allowed and the notice is hidden. */
const SERVER_SNAPSHOT: PrivacyPrefs = { analytics: false, optOutSaleShare: true, noticeDismissed: true };

export function usePrivacyPrefs(): PrivacyPrefs {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);
}

export function useGlobalPrivacyControl(): boolean {
  return useSyncExternalStore(
    () => () => {},
    hasGlobalPrivacyControl,
    () => false
  );
}
