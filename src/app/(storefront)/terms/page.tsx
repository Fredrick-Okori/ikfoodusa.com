import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

// DRAFT — a starting point for US e-commerce terms. Have counsel review before relying on it,
// in particular the liability, governing-law and dispute sections.

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply when you use ikfoodusa.com or buy from ${BRAND.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      current="/terms"
      intro={`These terms apply when you use ikfoodusa.com or buy from ${BRAND.legalName} (“${BRAND.name}”, “we”, “us”). By using the site or placing an order, you agree to them.`}
    >
      <h2>Who can buy</h2>
      <p>
        You must be at least 18 years old, or have a parent or guardian&rsquo;s permission, to place an order. We
        currently ship to addresses in the United States only.
      </p>

      <h2>Orders and payment</h2>
      <ul>
        <li>
          Placing an order is an offer to buy. We accept it when we email your confirmation and payment link or
          instructions. We may decline or cancel an order, for example if an item is out of stock or a price was
          listed in error; if you&rsquo;ve already paid, we&rsquo;ll refund you in full.
        </li>
        <li>
          All prices are in US dollars. Orders ship once payment clears. Card, PayPal and Zelle payments are handled
          by those providers under their own terms.
        </li>
        <li>
          <strong>Sales tax.</strong> Applicable state and local sales tax is calculated from your shipping address and
          shown on your payment link before you pay. Tax-exempt business buyers can send a valid exemption or resale
          certificate to <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
        </li>
        <li>Promo codes can&rsquo;t be combined, have no cash value and may end at any time.</li>
      </ul>

      <h2>Trade accounts</h2>
      <p>
        Wholesale pricing and Net-30 invoice terms are available only to approved trade accounts. Invoices are due 30
        days from the invoice date. We may suspend trade terms on overdue accounts. Trade pricing is confidential to
        the account holder.
      </p>

      <h2>Products</h2>
      <p>
        Vanilla is a natural agricultural product: bean length, color, moisture and aroma vary from harvest to
        harvest, and photos are representative. Product descriptions, grades and sizes are given in good faith. Check
        product pages and labels for ingredient and allergen information, and contact us before ordering if you have
        a specific dietary concern.
      </p>

      <h2>Shipping, returns and refunds</h2>
      <p>
        See our <Link href="/shipping-returns">Shipping &amp; Returns policy</Link>, which forms part of these terms.
      </p>

      <h2>Using the site</h2>
      <p>
        Don&rsquo;t misuse the site: no attempting to break its security, scraping it at scale, or using it for
        anything unlawful. All content on the site (text, photos, logos and design) belongs to {BRAND.name} or its
        licensors and may not be copied without permission.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Except as stated in these terms and to the extent the law allows, the site and products are provided
        &ldquo;as is&rdquo; without other warranties, express or implied. Nothing in these terms limits any rights you
        have under consumer protection laws that can&rsquo;t be waived.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent the law allows, our total liability for any claim relating to an order is limited to the amount
        you paid for that order, and we are not liable for indirect or consequential losses. Some states don&rsquo;t
        allow these limits, so they may not apply to you.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Illinois and applicable US federal law. Before starting
        any formal claim, please contact us so we can try to resolve the issue informally.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Changes apply to orders placed after the new effective date shown above.
      </p>
    </LegalPage>
  );
}
