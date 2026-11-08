import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

// DRAFT — prepared as a starting point for US (CCPA/CPRA and other state) privacy requirements.
// Have counsel review before relying on it.

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.name} collects, uses and protects your personal information, and the privacy rights available to US residents.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      current="/privacy"
      intro={`This policy explains what personal information ${BRAND.name} collects when you visit ikfoodusa.com or place an order, how we use it, and the choices and rights you have.`}
    >
      <h2>Summary</h2>
      <ul>
        <li>We collect the information needed to fulfil your order and run the store.</li>
        <li>
          <strong>We do not sell your personal information</strong>, and we do not share it for cross-context
          behavioral advertising.
        </li>
        <li>
          You can opt out of optional analytics at any time on{" "}
          <Link href="/privacy-choices">Your Privacy Choices</Link>, and we honor the Global Privacy Control (GPC)
          browser signal.
        </li>
        <li>You can ask us to access, correct or delete your information.</li>
      </ul>

      <h2>Information we collect</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Examples</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Identifiers and contact details</td>
              <td>Name, email address, phone number, shipping address</td>
              <td>You, at checkout or when contacting us</td>
            </tr>
            <tr>
              <td>Commercial information</td>
              <td>Products ordered, order totals, promo codes, order notes</td>
              <td>You, at checkout</td>
            </tr>
            <tr>
              <td>Business information</td>
              <td>Company name, PO number, trade account and quote request details</td>
              <td>You, on the wholesale pages and at checkout</td>
            </tr>
            <tr>
              <td>Internet and device activity</td>
              <td>Pages visited, page-load performance, browser and device type</td>
              <td>Automatically, through cookies and similar technology</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Payment details.</strong> We do not collect or store card numbers on this website. Card, PayPal and
        Zelle payments are completed through those providers using the payment link or instructions we email you.
      </p>
      <p>We do not collect sensitive personal information as defined by California law.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To process, ship and support your orders, including sending payment links and order updates</li>
        <li>To review trade account applications and respond to wholesale quote requests</li>
        <li>To answer questions and provide customer service</li>
        <li>To keep the site secure and working, and to measure and improve its performance</li>
        <li>To meet legal, tax and accounting obligations</li>
      </ul>
      <p>
        If you subscribe to our newsletter, we use your email to send it. Every email includes an unsubscribe link,
        and we honor unsubscribe requests promptly.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        <strong>Essential cookies and browser storage</strong> keep your cart and checkout working. They can&rsquo;t
        be switched off on this site, but you can block them in your browser (some features may then stop working).
      </p>
      <p>
        <strong>Optional analytics</strong> measure page speed and reliability (Vercel Speed Insights). You can turn
        them off on <Link href="/privacy-choices">Your Privacy Choices</Link>. If your browser sends a Global Privacy
        Control signal, we treat it as an opt-out automatically.
      </p>
      <p>We don&rsquo;t use advertising or cross-site tracking cookies.</p>

      <h2>How we share information</h2>
      <p>We share personal information only with service providers that help us run the business, under contracts that limit how they can use it:</p>
      <ul>
        <li>Website hosting and performance (Vercel)</li>
        <li>Database and file storage (Supabase)</li>
        <li>Payment processing (your chosen card processor, PayPal or Zelle)</li>
        <li>Shipping carriers, to deliver your order</li>
        <li>Email providers, to send order and account messages</li>
      </ul>
      <p>
        We may also disclose information when required by law, to protect our rights or the safety of others, or as
        part of a merger or sale of the business. We share order details with our parent company,{" "}
        {BRAND.parentCompany}, only as needed to supply and fulfil products.
      </p>

      <h2>How long we keep information</h2>
      <p>
        We keep order and business records for as long as needed to fulfil orders and for the period required by tax
        and accounting law (generally up to seven years). Analytics data is kept in aggregate form. When information
        is no longer needed, we delete or de-identify it.
      </p>

      <h2>Your privacy rights</h2>
      <p>
        Depending on your state of residence (including California, Colorado, Connecticut, Virginia, Texas, Oregon and
        other states with consumer privacy laws), you may have the right to:
      </p>
      <ul>
        <li>Know what personal information we have collected about you and how we use it</li>
        <li>Access a copy of your personal information</li>
        <li>Correct inaccurate personal information</li>
        <li>Delete personal information we hold about you</li>
        <li>Opt out of the sale or sharing of personal information, and of targeted advertising</li>
        <li>Not be discriminated against for using any of these rights</li>
      </ul>
      <p>
        We extend these rights to all US customers, wherever you live. To make a request, email{" "}
        <a href={`mailto:${BRAND.email}?subject=Privacy%20request`}>{BRAND.email}</a> with the subject
        &ldquo;Privacy request&rdquo;, or call {BRAND.phone}. We&rsquo;ll verify your identity by matching details
        from a past order, and respond within 45 days. You may use an authorized agent; we may ask for proof of their
        authority. If we decline a request, you may appeal by replying to our decision, and we&rsquo;ll respond to the
        appeal within the time your state&rsquo;s law requires.
      </p>
      <p>
        <strong>Opt-out.</strong> We don&rsquo;t sell or share personal information, but you can record an opt-out
        anytime on <Link href="/privacy-choices">Your Privacy Choices</Link>.
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        This site is intended for adults. We do not knowingly collect personal information from children under 13
        (or under 16 in California). If you believe a child has given us information, contact us and we&rsquo;ll
        delete it.
      </p>

      <h2>Security</h2>
      <p>
        We use HTTPS encryption, access controls and trusted service providers to protect your information. No system
        is completely secure, so please contact us right away if you suspect any misuse.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We&rsquo;ll post any changes on this page and update the effective date. If changes are significant, we&rsquo;ll
        provide more prominent notice.
      </p>
    </LegalPage>
  );
}
