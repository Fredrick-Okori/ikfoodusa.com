import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyChoicesForm } from "./PrivacyChoicesForm";

export const metadata: Metadata = {
  title: "Your Privacy Choices",
  description: "Opt out of optional analytics and the sale or sharing of personal information.",
  alternates: { canonical: "/privacy-choices" },
};

export default function PrivacyChoicesPage() {
  return (
    <LegalPage
      title="Your Privacy Choices"
      current="/privacy-choices"
      intro="Control optional analytics and record a Do Not Sell or Share opt-out. Your choices are saved in this browser."
    >
      <PrivacyChoicesForm />

      <h2>Requests about your data</h2>
      <p>
        To access, correct or delete the personal information we hold about you, see &ldquo;Your privacy
        rights&rdquo; in our <Link href="/privacy">Privacy Policy</Link> or contact us below.
      </p>
    </LegalPage>
  );
}
