import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";
import { formatUSD } from "@/utils/currency";

// Facts here mirror the storefront FAQ (home page) and BRAND shipping settings — keep them in sync.

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: `Shipping times, costs and the return policy for orders from ${BRAND.name}. Free US shipping over ${formatUSD(BRAND.freeShippingThreshold)}.`,
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      title="Shipping & Returns"
      current="/shipping-returns"
      intro={`Free standard shipping on US orders of ${formatUSD(BRAND.freeShippingThreshold)} or more, and 30-day returns on unopened products.`}
    >
      <h2>Where we ship</h2>
      <p>We ship to addresses in the United States. Bulk and export orders can be quoted on the wholesale page.</p>

      <h2>Costs and delivery times</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Order subtotal (after discounts)</th>
              <th scope="col">Standard shipping</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Under {formatUSD(BRAND.freeShippingThreshold)}</td>
              <td>{formatUSD(BRAND.standardShippingFee)} flat rate</td>
            </tr>
            <tr>
              <td>{formatUSD(BRAND.freeShippingThreshold)} or more</td>
              <td>Free</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>Orders ship within 1–2 business days after payment clears (business days are Monday–Friday, excluding US federal holidays).</li>
        <li>Standard delivery takes 3–6 business days after shipping.</li>
        <li>We email tracking details when your order ships.</li>
      </ul>
      <p>
        If we can&rsquo;t ship within the time stated, we&rsquo;ll tell you and give you the choice of a new date or a
        full refund, as required by the FTC Mail, Internet, or Telephone Order Merchandise Rule.
      </p>

      <h2>Damaged, incorrect or missing items</h2>
      <p>
        If anything arrives damaged or isn&rsquo;t what you ordered, email{" "}
        <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> within 7 days of delivery with your order number and a
        photo. We&rsquo;ll send a replacement or a refund at no cost to you. If tracking shows delivered but you
        can&rsquo;t find the package, contact us and we&rsquo;ll open a claim with the carrier.
      </p>

      <h2>Returns</h2>
      <ul>
        <li>Unopened products in their original packaging can be returned within 30 days of delivery.</li>
        <li>
          For food safety, opened food products can&rsquo;t be returned unless they arrived damaged or defective.
        </li>
        <li>
          To start a return, email <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> with your order number.
          We&rsquo;ll reply with the return address and instructions.
        </li>
        <li>Return shipping is paid by the customer unless the return is due to our error or a damaged item.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect your return, we&rsquo;ll refund the product price to your original payment method
        and email you to confirm. Original shipping charges are refunded only when the return is due to our error.
        Your bank or card issuer may take a few extra days to show the credit.
      </p>

      <h2>Wholesale and trade orders</h2>
      <p>
        Bulk and custom orders are quoted individually; shipping, lead times and return terms are confirmed in your
        quote or invoice.
      </p>
    </LegalPage>
  );
}
