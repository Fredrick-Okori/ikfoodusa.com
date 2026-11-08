import Link from "next/link";
import { BRAND, brandAddressLine } from "@/lib/brand";
import { LegalSidebar } from "@/components/LegalSidebar";

/** Effective date shown on every policy page. Update when a policy changes. */
export const POLICY_EFFECTIVE_DATE = "November 7, 2026";

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/privacy-choices", label: "Your Privacy Choices" },
];

/** Shared shell for policy pages: big title band, policy switcher, "On this page" rail, prose column. */
export function LegalPage({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro?: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <main className="overflow-x-clip bg-beige-50 text-forest-950">
      <section className="bg-forest-950 text-beige-50">
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 lg:px-12 lg:pb-20 lg:pt-28">
          <h1
            data-legal-title
            className="max-w-5xl font-sans text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.92] tracking-[-0.045em]"
          >
            {title}
            <span className="text-secondary">.</span>
          </h1>
          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {intro && (
              <p data-legal-foot className="max-w-2xl text-lg leading-relaxed text-beige-100/75 sm:text-xl">
                {intro}
              </p>
            )}
            <p data-legal-foot className="shrink-0 text-sm font-bold text-secondary">
              Effective {POLICY_EFFECTIVE_DATE}
            </p>
          </div>
        </div>

        <nav aria-label="Policies" className="border-t border-white/10">
          <ul className="mx-auto flex max-w-7xl gap-x-8 overflow-x-auto px-5 [scrollbar-width:none] sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href} data-legal-tab className="shrink-0">
                <Link
                  href={link.href}
                  aria-current={link.href === current ? "page" : undefined}
                  className="block border-b-4 border-transparent py-5 text-base font-black tracking-[-0.03em] text-beige-50/40 transition-colors hover:text-beige-50 aria-[current=page]:border-secondary aria-[current=page]:text-beige-50 sm:text-lg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_15rem] lg:gap-24 lg:px-12 lg:py-28">
        <article data-legal-article className="legal-prose max-w-3xl">
          {children}

          <h2 id="contact">Contact us</h2>
          <address className="not-italic">
            {BRAND.legalName} ({BRAND.name})
            <br />
            {brandAddressLine()}
            <br />
            Email: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            <br />
            Phone: <a href={`tel:${BRAND.phoneE164}`}>{BRAND.phone}</a>
          </address>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalSidebar />
        </aside>
      </div>
    </main>
  );
}
