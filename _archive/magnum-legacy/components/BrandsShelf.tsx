"use client";

import { ShieldCheck } from "lucide-react";

interface Brand {
  name: string;
  logo: string;
}

const brandLogos: Brand[] = [
  { name: "Smirnoff", logo: "/brands/smirnoff.svg" },
  { name: "Captain Morgan", logo: "/brands/captain-morgan-new.svg" },
  { name: "Don Julio", logo: "/brands/don-julio-logo.svg" },
  { name: "Cîroc", logo: "/brands/ciroc-svg-new.svg" },
  { name: "Gordon's", logo: "/brands/gordons-svg.svg" },
  { name: "Guinness", logo: "/brands/guinness-svg-new.svg" },
  { name: "Johnnie Walker", logo: "/brands/johnnie-walker-svg.svg" },
  { name: "The Singleton", logo: "/brands/singleton.svg" },
  { name: "Mortlach", logo: "/brands/mortlach-image.svg" },
  { name: "Astral Tequila", logo: "/brands/astral-tequilla-svg.svg" },
  { name: "Bundaberg", logo: "/brands/bundaberg-svg.svg" },
  { name: "Seagram's 7", logo: "/brands/seagrams-seven-crown.svg" },
];

export function BrandsShelf() {
  return (
    <section
      className="relative z-20 border-t border-neutral-200/80 bg-white py-16 text-neutral-900 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12 space-y-12">
        
        {/* Subtitle Badge Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-beige-200 bg-beige-50 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-forest-700"
          >
            <ShieldCheck size={13} className="text-forest-600" />
            <span>Official Distillery Partners</span>
          </div>

          <h2
            className="font-serif text-2xl font-light tracking-tight text-neutral-900 sm:text-3xl"
          >
            Featured Brands & Distilleries
          </h2>
        </div>

        {/* Flat Brand Logos Grid (No Card Borders or Zoom Effect) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 lg:gap-12 items-center justify-items-center">
          {brandLogos.map((brand) => (
            <div
              key={brand.name}
              className="flex h-24 sm:h-28 w-full max-w-[200px] items-center justify-center p-2"
            >
              {/* Clean SVG Logo */}
              <div className="relative flex h-full w-full items-center justify-center">
                <img
                  src={brand.logo}
                  alt={`${brand.name} official distillery brand partner - Magnum Liquors Kampala`}
                  width={160}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="max-h-16 sm:max-h-20 max-w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
