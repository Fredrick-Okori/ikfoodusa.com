import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: `${BRAND.name} is committed to making its website usable by everyone, following WCAG 2.1 Level AA.`,
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility Statement"
      current="/accessibility"
      intro={`${BRAND.name} wants everyone, including people with disabilities, to be able to browse and buy from our store.`}
    >
      <h2>Our standard</h2>
      <p>
        We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, the standard commonly used
        for websites under the Americans with Disabilities Act (ADA).
      </p>

      <h2>What we&rsquo;ve done</h2>
      <ul>
        <li>Pages work with a keyboard alone, with visible focus and a &ldquo;Skip to main content&rdquo; link.</li>
        <li>Images have text alternatives, and form fields have labels and clear error messages.</li>
        <li>Text and controls are designed for sufficient color contrast.</li>
        <li>You can zoom up to 200% and beyond without losing content.</li>
        <li>Animations are reduced when your device is set to &ldquo;reduce motion&rdquo;.</li>
        <li>We check pages with automated accessibility testing and keyboard-only testing.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Some product photos and videos supplied by growers may not yet have full descriptions or captions. We&rsquo;re
        working through them; tell us if one gets in your way and we&rsquo;ll help right away.
      </p>

      <h2>Need help or found a problem?</h2>
      <p>
        If you have trouble using any part of the site, contact us and we&rsquo;ll help you place your order by phone or
        email and fix the issue. Email <a href={`mailto:${BRAND.email}?subject=Accessibility`}>{BRAND.email}</a> or
        call <a href={`tel:${BRAND.phoneE164}`}>{BRAND.phone}</a>. We aim to respond within 2 business days.
      </p>
    </LegalPage>
  );
}
