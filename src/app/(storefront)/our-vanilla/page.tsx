import type { Metadata } from "next";
import { BRAND, PARENT } from "@/lib/brand";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/JsonLd";
import { OurVanillaStory } from "./OurVanillaStory";

const TITLE = "Our Vanilla: From Garden to Kitchen";
const DESCRIPTION = `How vanilla from ${PARENT.name} is grown, hand-pollinated, slow-cured (killing, sweating, drying, conditioning), graded and packed, then sold by ${BRAND.name} as whole beans, pure extract and vanilla powder.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/our-vanilla" },
  openGraph: {
    title: `${TITLE} | ${BRAND.name}`,
    description: DESCRIPTION,
    url: "/our-vanilla",
    type: "article",
    images: [{ url: "/Madagascar_SAVAN_00096_lr-1024x682.webp", width: 1024, height: 682, alt: "Freshly harvested green vanilla pods in a woven basket" }],
  },
};

export default function OurVanillaPage() {
  return (
    <>
      <WebPageJsonLd
        type="AboutPage"
        path="/our-vanilla"
        name={TITLE}
        description={DESCRIPTION}
        image="/Madagascar_SAVAN_00096_lr-1024x682.webp"
        about={["Vanilla planifolia", "Hand pollination", "Vanilla curing", "Vanilla grading", PARENT.name]}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Our vanilla", url: "/our-vanilla" }]} />
      <OurVanillaStory />
    </>
  );
}
