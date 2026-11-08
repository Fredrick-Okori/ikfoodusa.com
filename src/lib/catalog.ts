/**
 * Vanilla product categories. These seed the `categories` table and act as the
 * fallback when the database has none; once categories exist in Supabase they are
 * managed from /dashboard/categories.
 */
export interface Category {
  id?: string;
  name: string;
  slug: string;
  description: string;
  subcategories: string[];
  displayOrder: number;
  isActive: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    name: "Grade A Beans",
    slug: "grade-a-beans",
    description: "Plump, oily gourmet beans (30–35% moisture) for scraping, baking and infusions.",
    subcategories: ["Planifolia", "Tahitensis", "Bulk & Wholesale"],
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Grade B Beans",
    slug: "grade-b-beans",
    description: "Drier extraction-grade beans (15–25% moisture), ideal for homemade extract.",
    subcategories: ["Extract Grade", "Bulk & Wholesale"],
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Vanilla Extract",
    slug: "vanilla-extract",
    description: "Pure, single-fold and double-fold extracts for kitchens and bakeries.",
    subcategories: ["Single Fold", "Double Fold", "Alcohol-Free"],
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Vanilla Powder",
    slug: "vanilla-powder",
    description: "Whole ground vanilla beans — heat-stable flavor with no added sugar or alcohol.",
    subcategories: ["Pure Ground Bean", "Culinary Blend"],
    displayOrder: 4,
    isActive: true,
  },
  {
    name: "Vanilla Caviar",
    slug: "vanilla-caviar",
    description: "Hand-scraped vanilla seeds for custards, ice cream and fine pastry.",
    subcategories: ["Pure Seeds", "Bean Paste"],
    displayOrder: 5,
    isActive: true,
  },
  {
    name: "Vanilla Splits",
    slug: "vanilla-splits",
    description: "Split and cut beans at an accessible price — full flavor, imperfect looks.",
    subcategories: ["Split Beans", "Cuts & Pieces"],
    displayOrder: 6,
    isActive: true,
  },
  {
    name: "Gifts & Bundles",
    slug: "gifts-bundles",
    description: "Curated sets and sampler boxes for bakers and home cooks.",
    subcategories: ["Sampler Sets", "Gift Boxes"],
    displayOrder: 7,
    isActive: true,
  },
];

export const DEFAULT_CATEGORY = DEFAULT_CATEGORIES[0].name;

/** Photo used for each category tile; falls back to the category's first product photo. */
const CATEGORY_IMAGES: Record<string, string> = {
  "grade-a-beans": "/5_2048x.webp",
  "grade-b-beans": "/product_hero.avif",
  "vanilla-extract": "/file.jpg",
  "vanilla-powder": "/VP-500g.webp",
  "vanilla-caviar": "/family-products.webp",
  "vanilla-splits": "/png-cardbox-Front.webp",
  "gifts-bundles": "/4eff68_a62e81ef19d64a27aa103163d0668fb0~mv2.avif",
};

export function categoryImage(slug: string, fallback?: string): string {
  return CATEGORY_IMAGES[slug] || fallback || "/product_hero.avif";
}

export const VANILLA_SPECIES = ["Planifolia", "Tahitensis", "Pompona"];

/** Fetch the active category list from the API on the client. */
export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  try {
    const res = await fetch(`/api/categories${includeInactive ? "?all=1" : ""}`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}
