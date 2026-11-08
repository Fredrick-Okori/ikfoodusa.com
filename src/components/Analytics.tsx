"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePrivacyPrefs } from "@/lib/privacy";

/** Optional performance analytics, only loaded while the visitor hasn't opted out (or sent GPC). */
export function Analytics() {
  const { analytics } = usePrivacyPrefs();
  return analytics ? <SpeedInsights /> : null;
}
