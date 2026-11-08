"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface SubMenuColumn {
  items: { label: string; href: string; hasDropdown?: boolean }[];
}

interface MegaMenuData {
  cardTitle: string;
  cardDescription: string;
  cardCtaText: string;
  cardCtaLink: string;
  columns: SubMenuColumn[];
}

interface NavItem {
  label: string;
  href: string;
  megaMenu?: MegaMenuData;
}

const navItems: NavItem[] = [
  {
    label: "WHISKEY",
    href: "/discover?category=Whiskey",
    megaMenu: {
      cardTitle: "Single malts & fine whiskey",
      cardDescription:
        "Rare Scottish single malts, small-batch Kentucky bourbons, aged Irish pots, and master-crafted Japanese blends.",
      cardCtaText: "Explore whiskies",
      cardCtaLink: "/discover?category=Whiskey",
      columns: [
        {
          items: [
            { label: "Single Malt Scotch", href: "/discover?category=Whiskey", hasDropdown: true },
            { label: "Bourbon & American", href: "/discover?category=Whiskey", hasDropdown: true },
            { label: "Blended Scotch", href: "/discover?category=Whiskey", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Irish Whiskey", href: "/discover?category=Whiskey", hasDropdown: true },
            { label: "Japanese Whisky", href: "/discover?category=Whiskey", hasDropdown: true },
            { label: "Rye & Peated Malts", href: "/discover?category=Whiskey", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "RUM",
    href: "/discover?category=Rum",
    megaMenu: {
      cardTitle: "Caribbean & aged rums",
      cardDescription:
        "Tropical solera-aged dark rums, craft spiced reserves, velvety white rums, and artisanal pure pot-still cane spirits.",
      cardCtaText: "Discover rums",
      cardCtaLink: "/discover?category=Rum",
      columns: [
        {
          items: [
            { label: "Dark & Aged Rum", href: "/discover?category=Rum", hasDropdown: true },
            { label: "Spiced & Botanical", href: "/discover?category=Rum", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "White & Silver Rum", href: "/discover?category=Rum", hasDropdown: true },
            { label: "Overproof & Agricole", href: "/discover?category=Rum", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "VODKA",
    href: "/discover?category=Vodka",
    megaMenu: {
      cardTitle: "Ultra-pure craft vodkas",
      cardDescription:
        "Multi-distilled winter wheat, artisanal potato, and naturally botanical infused vodkas crafted for ultimate smoothness.",
      cardCtaText: "View vodkas",
      cardCtaLink: "/discover?category=Vodka",
      columns: [
        {
          items: [
            { label: "Classic Grain Vodka", href: "/discover?category=Vodka", hasDropdown: true },
            { label: "Craft & Potato Vodka", href: "/discover?category=Vodka", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Citrus & Fruit Infusions", href: "/discover?category=Vodka", hasDropdown: true },
            { label: "Prestige Luxury Editions", href: "/discover?category=Vodka", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "LIQUEUR",
    href: "/discover?category=Liqueur",
    megaMenu: {
      cardTitle: "Artisanal cordials & digestifs",
      cardDescription:
        "Centuries-old alpine herbal elixirs, velvety Irish cream liqueurs, coffee cordials, and fruit-infused aperitifs.",
      cardCtaText: "Explore liqueurs",
      cardCtaLink: "/discover?category=Liqueur",
      columns: [
        {
          items: [
            { label: "Herbal & Italian Amari", href: "/discover?category=Liqueur", hasDropdown: true },
            { label: "Silky Cream Liqueurs", href: "/discover?category=Liqueur", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Coffee & Nut Cordials", href: "/discover?category=Liqueur", hasDropdown: true },
            { label: "Triple Sec & Citrus", href: "/discover?category=Liqueur", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "GIN",
    href: "/discover?category=Gin",
    megaMenu: {
      cardTitle: "Botanical & London dry gins",
      cardDescription:
        "Crisp juniper forward London dry, contemporary floral craft spirits, cucumber infusions, and barrel-aged Old Tom gins.",
      cardCtaText: "Browse gins",
      cardCtaLink: "/discover?category=Gin",
      columns: [
        {
          items: [
            { label: "London Dry Gin", href: "/discover?category=Gin", hasDropdown: true },
            { label: "Botanical & Floral", href: "/discover?category=Gin", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Old Tom & Navy Strength", href: "/discover?category=Gin", hasDropdown: true },
            { label: "Pink & Berry Infused", href: "/discover?category=Gin", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "TEQUILA",
    href: "/discover?category=Tequila",
    megaMenu: {
      cardTitle: "100% Blue Weber agave",
      cardDescription:
        "Highland Jalisco estates, extra añejo master reserves, crisp crystal blanco, and traditional artisanal smoky mezcals.",
      cardCtaText: "Discover tequilas",
      cardCtaLink: "/discover?category=Tequila",
      columns: [
        {
          items: [
            { label: "Extra Añejo & Añejo", href: "/discover?category=Tequila", hasDropdown: true },
            { label: "Reposado Cask Aged", href: "/discover?category=Tequila", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Blanco / Silver Agave", href: "/discover?category=Tequila", hasDropdown: true },
            { label: "Artisanal Oaxacan Mezcal", href: "/discover?category=Tequila", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "BRANDY",
    href: "/discover?category=Brandy",
    megaMenu: {
      cardTitle: "Prestige French cognac & brandy",
      cardDescription:
        "Historic Grande Champagne cognacs, aged Limousin oak VSOPs, decades-old XOs, rustic Gascon armagnacs, and fine grappas.",
      cardCtaText: "View brandies",
      cardCtaLink: "/discover?category=Brandy",
      columns: [
        {
          items: [
            { label: "Cognac VS & VSOP", href: "/discover?category=Brandy", hasDropdown: true },
            { label: "Cognac XO & Prestige", href: "/discover?category=Brandy", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Gascon Armagnac", href: "/discover?category=Brandy", hasDropdown: true },
            { label: "Pisco & Aged Fruit Brandy", href: "/discover?category=Brandy", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "CHAMPAGNE",
    href: "/discover?category=Champagne",
    megaMenu: {
      cardTitle: "Prestige French champagne & bubbles",
      cardDescription:
        "Luminous Grand Cru Blanc de Blancs, delicate Rosé champagne, vintage collector cuvées, and refined Italian Proseccos.",
      cardCtaText: "Explore champagne",
      cardCtaLink: "/discover?category=Champagne",
      columns: [
        {
          items: [
            { label: "Brut Vintage Champagne", href: "/discover?category=Champagne", hasDropdown: true },
            { label: "100% Blanc de Blancs", href: "/discover?category=Champagne", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Prestige Rosé Champagne", href: "/discover?category=Champagne", hasDropdown: true },
            { label: "Italian Prosecco Superiore", href: "/discover?category=Champagne", hasDropdown: true },
          ],
        },
      ],
    },
  },
  {
    label: "WINE",
    href: "/discover?category=Wine",
    megaMenu: {
      cardTitle: "Curated global wine cellar",
      cardDescription:
        "Bold Bordeaux reds, crisp mineral Chardonnays, refreshing Provence rosés, and aged dessert port wines from iconic estates.",
      cardCtaText: "Browse wine cellar",
      cardCtaLink: "/discover?category=Wine",
      columns: [
        {
          items: [
            { label: "Cabernet, Pinot & Bold Reds", href: "/discover?category=Wine", hasDropdown: true },
            { label: "Chardonnay & Crisp Whites", href: "/discover?category=Wine", hasDropdown: true },
          ],
        },
        {
          items: [
            { label: "Provence Rosé Wines", href: "/discover?category=Wine", hasDropdown: true },
            { label: "Dessert, Port & Fortified", href: "/discover?category=Wine", hasDropdown: true },
          ],
        },
      ],
    },
  },
];

export function HeroNavStrip() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const currentItem = navItems.find((i) => i.label === activeMenu);
  const megaData = currentItem?.megaMenu;

  return (
    <div
      className="sticky top-16 lg:top-[73px] z-30 border-b border-neutral-200/80 bg-white/95 text-neutral-800 backdrop-blur-md select-none transition-colors duration-300"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-5 py-3.5 sm:px-10 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] font-serif scrollbar-none">
        {navItems.map((item) => {
          const hasMenu = !!item.megaMenu;
          const isOpen = activeMenu === item.label;

          return (
            <div
              key={item.label}
              className="group py-1"
              onMouseEnter={() => {
                if (hasMenu) setActiveMenu(item.label);
                else setActiveMenu(null);
              }}
            >
              <Link
                href={item.href}
                className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors duration-200 ${
                  isOpen ? "text-forest-700 font-bold" : "hover:text-forest-700"
                }`}
              >
                {item.label}
                {hasMenu && (
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-forest-700" : "opacity-40 group-hover:opacity-100"
                    }`}
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Floating Mega Dropdown Menu Window */}
      {megaData && (
        <div
          className="absolute left-0 top-full w-full border-b border-neutral-200/90 bg-white/98 text-neutral-900 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-1"
          onMouseEnter={() => setActiveMenu(activeMenu)}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 md:flex-row lg:px-10">
            {/* Left Column Featured Card */}
            <div className="flex w-full flex-col justify-between rounded-2xl border border-neutral-200/80 bg-beige-50 p-6 md:w-1/3 shadow-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-700">
                  Collection Overview
                </span>
                <h3 className="mt-1.5 font-serif text-2xl font-normal tracking-tight text-neutral-900">
                  {megaData.cardTitle}
                </h3>
                <p className="mt-2 text-xs font-light leading-relaxed text-neutral-600">
                  {megaData.cardDescription}
                </p>
              </div>

              <Link
                href={megaData.cardCtaLink}
                onClick={() => setActiveMenu(null)}
                className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-900 hover:text-forest-700 transition underline decoration-[#d4af37] decoration-2 underline-offset-4"
              >
                {megaData.cardCtaText} <ChevronRight size={13} />
              </Link>
            </div>

            {/* Right Sub-Columns Grid */}
            <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10">
              {megaData.columns.map((col, idx) => (
                <ul key={idx} className="space-y-3">
                  {col.items.map((sub, sIdx) => (
                    <li key={sIdx}>
                      <Link
                        href={sub.href}
                        onClick={() => setActiveMenu(null)}
                        className="group flex items-center justify-between py-1 text-xs text-neutral-700 hover:text-neutral-900 transition"
                      >
                        <span className="font-medium group-hover:text-forest-700 transition">
                          {sub.label}
                        </span>
                        <ChevronRight
                          size={13}
                          className="opacity-0 text-forest-700 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>

            {/* Quick Close Button */}
            <button
              onClick={() => setActiveMenu(null)}
              aria-label="Close menu"
              className="absolute right-6 top-6 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
