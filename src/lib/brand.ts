/**
 * Single source of truth for brand identity and contact details.
 * Update these values (or the matching env vars) instead of hunting through components.
 */
export const BRAND = {
  name: "IK Foods USA",
  shortName: "IK Foods",
  /** Registered legal entity */
  legalName: "IK FOOD U LLC",
  parentCompany: "IK Food Uganda",
  tagline: "Pure vanilla, from bean to bottle.",
  description:
    "Premium vanilla beans, extracts, powder, caviar and splits — sourced direct from growers and shipped across the United States.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ikfoodusa.com",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@ikfoodusa.com",
  /** Display format */
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "(630) 656-3972",
  /** E.164 format for tel: links and structured data */
  phoneE164: "+16306563972",
  address: {
    street: "2405 Essington Road",
    unit: "Suite B",
    city: "Joliet",
    state: "IL",
    stateName: "Illinois",
    zip: "60435",
    country: "US",
  },
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
  },
  /** Order numbers look like IKF-12345 */
  orderPrefix: "IKF",
  /** Free standard shipping at or above this subtotal (USD) */
  freeShippingThreshold: 75,
  /** Flat standard shipping below the threshold (USD) */
  standardShippingFee: 7.95,
  /** Browser storage namespace */
  storagePrefix: "ikfoods",
} as const;

/** Parent company and exporter in Uganda. */
export const PARENT = {
  name: "IK Food Uganda",
  url: "https://www.ikfoodug.com",
  phone: "+256 776 341 713",
  phoneE164: "+256776341713",
  email: "ikfoodugandalimited@gmail.com",
  poBox: "P.O. Box 110281",
  street: "Atenyi Rd, Seguku",
  city: "Kampala",
  country: "Uganda",
  /** Facts as published on ikfoodug.com; keep in sync with the parent site. */
  foundingDate: "2015",
  growingRegion: "Central Uganda",
  description:
    "Ugandan vanilla grower and exporter founded in 2015, working with smallholder farmers in Central Uganda and exporting to Europe, Asia and the United States.",
} as const;

/** Wholesale/retail policy facts shared by structured data, llms.txt and the FAQ. */
export const POLICIES = {
  returnDays: 30,
  handlingDays: [1, 2] as const,
  transitDays: [3, 6] as const,
} as const;

/**
 * Profiles that represent the brand elsewhere on the web, for schema.org `sameAs`.
 * Placeholder social URLs (a bare network homepage like "https://instagram.com/") are skipped,
 * since they would tell search engines the brand *is* that network.
 */
export function brandSameAs(): string[] {
  const real = Object.values(BRAND.social).filter((url) => {
    try {
      return new URL(url).pathname.replace(/\/+$/, "").length > 0;
    } catch {
      return false;
    }
  });
  return [...real, PARENT.url];
}

/** One-line postal address, e.g. for invoices and the footer. */
export const brandAddressLine = () =>
  `${BRAND.address.street}, ${BRAND.address.unit}, ${BRAND.address.city}, ${BRAND.address.state} ${BRAND.address.zip}`;

export const storageKey = (key: string) => `${BRAND.storagePrefix}_${key}`;
