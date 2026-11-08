import { getStoreProductsCatalog } from "@/lib/products";
import { DEFAULT_CATEGORIES } from "@/lib/catalog";
import { categoryHref, productHref } from "@/data/products";
import { BRAND, PARENT, POLICIES } from "@/lib/brand";
import { formatUSD } from "@/utils/currency";

// Regenerated hourly so prices and stock stay close to live.
export const revalidate = 3600;

/**
 * /llms.txt — a plain-Markdown summary of the business for AI assistants and answer engines
 * (see https://llmstxt.org). Facts about the parent company mirror ikfoodug.com.
 */
export async function GET() {
  const url = (path: string) => `${BRAND.url}${path}`;

  let products: Awaited<ReturnType<typeof getStoreProductsCatalog>> = [];
  try {
    products = await getStoreProductsCatalog();
  } catch {
    // Still serve the rest of the summary if the catalog is unavailable.
  }

  const productLines = products
    .slice(0, 60)
    .map(
      (p) =>
        `- [${p.name}](${url(productHref(p))}): ${p.category}${p.size ? `, ${p.size}` : ""}, ${formatUSD(p.numericPrice)}${
          p.inStock ? "" : " (sold out)"
        }${p.origin ? `. Origin: ${p.origin}` : ""}`
    )
    .join("\n");

  const categoryLines = DEFAULT_CATEGORIES.filter((c) => c.isActive)
    .map((c) => `- [${c.name}](${url(categoryHref(c.name))}): ${c.description}`)
    .join("\n");

  const body = `# ${BRAND.name}

> ${BRAND.name} (${BRAND.legalName}) is the United States branch of ${PARENT.name}, a Ugandan vanilla grower and exporter founded in ${PARENT.foundingDate}. It sells premium vanilla beans, pure vanilla extract, vanilla powder, vanilla caviar and split beans online to home bakers and businesses across the USA, and supplies bakeries, manufacturers and distributors wholesale.

## Key facts

- Parent company: [${PARENT.name}](${PARENT.url}), founded ${PARENT.foundingDate}, based in ${PARENT.city}, ${PARENT.country}. Vanilla is grown with smallholder farmers in ${PARENT.growingRegion}, hand-pollinated, hand-harvested and slow-cured.
- US branch: ${BRAND.name}, ${BRAND.address.street}, ${BRAND.address.unit}, ${BRAND.address.city}, ${BRAND.address.stateName} ${BRAND.address.zip}. Ships across the United States.
- Product origin: the US catalog includes Ugandan vanilla from the parent company and selected vanilla from other origins such as Madagascar; each product page and the list below states its origin.
- Shipping: orders ship in ${POLICIES.handlingDays[0]}–${POLICIES.handlingDays[1]} business days; standard US delivery takes ${POLICIES.transitDays[0]}–${POLICIES.transitDays[1]} business days. Free shipping on orders of ${formatUSD(BRAND.freeShippingThreshold)} or more, otherwise a flat ${formatUSD(BRAND.standardShippingFee)}.
- Returns: unopened products can be returned within ${POLICIES.returnDays} days; damaged items are replaced or refunded.
- Payment: secure card payment link, PayPal invoice or Zelle, sent by email after the order is placed. Approved trade accounts can use Net-30 invoices.
- Wholesale: trade pricing, volume discounts, PO numbers and Net-30 invoicing for bakeries, ice cream makers, restaurants, food manufacturers, extract producers and distributors. Bulk and export quotes on request.
- Grades: Grade A (gourmet) beans hold 30–35% moisture and are best for scraping seeds; Grade B (extraction) beans hold 15–25% moisture and are best for making extract. Grade describes moisture and looks, not flavor quality.
- Storage: keep beans in an airtight jar or vacuum bag in a cool, dark cupboard; do not refrigerate. Stored this way they keep for 1–2 years.

## Main pages

- [Home](${url("/")}): featured products, grade guide, how our vanilla is made, FAQ
- [Shop all vanilla](${url("/shop")}): full catalog with filters by category, species and price
- [Our vanilla: from garden to kitchen](${url("/our-vanilla")}): how the vanilla is grown, hand-pollinated, cured (killing, sweating, drying, conditioning), graded and packed
- [Wholesale & trade](${url("/wholesale")}): trade accounts and bulk or export quotes
- [Grade guide](${url("/#guide")}): Grade A vs Grade B vs extract, powder and caviar

## Product categories

${categoryLines}

## Products
${productLines ? `\n${productLines}\n` : "\nSee the [shop](" + url("/shop") + ") for the current catalog.\n"}
## Policies

- [Shipping & returns](${url("/shipping-returns")})
- [Privacy policy](${url("/privacy")})
- [Terms of service](${url("/terms")})
- [Accessibility](${url("/accessibility")})

## Contact

- ${BRAND.name}: ${BRAND.email}, ${BRAND.phone}
- ${PARENT.name}: ${PARENT.email}, ${PARENT.phone}, ${PARENT.url}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
