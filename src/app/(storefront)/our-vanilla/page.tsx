import type { Metadata } from "next";
import { BRAND, PARENT } from "@/lib/brand";
import { OurVanillaStory } from "./OurVanillaStory";

export const metadata: Metadata = {
  title: "Our Vanilla: From Garden to Kitchen",
  description: `How ${BRAND.name} vanilla, sourced through our parent company ${PARENT.name}, is grown, hand-pollinated, slow-cured, graded and packed, then turned into whole beans, pure extract and vanilla powder.`,
  alternates: { canonical: "/our-vanilla" },
};

export default function OurVanillaPage() {
  return <OurVanillaStory />;
}
