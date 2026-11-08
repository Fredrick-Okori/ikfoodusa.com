import { Product, productHref } from "@/data/products";
import { BRAND, PARENT, POLICIES, brandSameAs } from "@/lib/brand";

const BASE_URL = BRAND.url;
const STORE_ID = `${BASE_URL}/#store`;
const PARENT_ID = `${PARENT.url}/#organization`;

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inlined; data comes from our own catalog, with "<" escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const absolute = (path: string) => (path.startsWith("http") ? path : `${BASE_URL}${path}`);

/** Return policy shared by the store and every offer. */
const returnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: POLICIES.returnDays,
  returnMethod: "https://schema.org/ReturnByMail",
  merchantReturnLink: `${BASE_URL}/shipping-returns`,
};

/** US shipping for one offer: free at or above the threshold, flat rate below it. */
function shippingDetails(price: number) {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
    shippingRate: {
      "@type": "MonetaryAmount",
      value: price >= BRAND.freeShippingThreshold ? 0 : BRAND.standardShippingFee,
      currency: "USD",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: POLICIES.handlingDays[0],
        maxValue: POLICIES.handlingDays[1],
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: POLICIES.transitDays[0],
        maxValue: POLICIES.transitDays[1],
        unitCode: "DAY",
      },
    },
  };
}

/** Site-wide: the US store, its parent exporter in Uganda, and the website search box. */
export function StoreJsonLd() {
  const parent = {
    "@type": "Organization",
    "@id": PARENT_ID,
    name: PARENT.name,
    url: PARENT.url,
    description: PARENT.description,
    foundingDate: PARENT.foundingDate,
    email: PARENT.email,
    telephone: PARENT.phoneE164,
    address: {
      "@type": "PostalAddress",
      postOfficeBoxNumber: PARENT.poBox.replace("P.O. Box ", ""),
      streetAddress: PARENT.street,
      addressLocality: PARENT.city,
      addressCountry: "UG",
    },
    areaServed: ["Europe", "Asia", "United States"],
    subOrganization: { "@id": STORE_ID },
  };

  const store = {
    "@type": "OnlineStore",
    "@id": STORE_ID,
    name: BRAND.name,
    alternateName: [BRAND.shortName, "IK Food USA"],
    legalName: BRAND.legalName,
    url: BASE_URL,
    logo: { "@type": "ImageObject", url: `${BASE_URL}/logo_clean.webp` },
    image: `${BASE_URL}/opengraph-image`,
    slogan: BRAND.tagline,
    description: `${BRAND.description} ${BRAND.name} is the United States branch of ${PARENT.name}, a vanilla grower and exporter founded in ${PARENT.foundingDate}.`,
    email: BRAND.email,
    telephone: BRAND.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${BRAND.address.street}, ${BRAND.address.unit}`,
      addressLocality: BRAND.address.city,
      addressRegion: BRAND.address.state,
      postalCode: BRAND.address.zip,
      addressCountry: BRAND.address.country,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: BRAND.email,
        telephone: BRAND.phoneE164,
        areaServed: "US",
        availableLanguage: "English",
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        url: `${BASE_URL}/wholesale`,
        email: BRAND.email,
        telephone: BRAND.phoneE164,
        areaServed: "US",
        availableLanguage: "English",
      },
    ],
    parentOrganization: { "@id": PARENT_ID },
    currenciesAccepted: "USD",
    paymentAccepted: "Credit Card, PayPal, Zelle, Invoice",
    areaServed: { "@type": "Country", name: "United States" },
    hasMerchantReturnPolicy: returnPolicy,
    knowsAbout: [
      "Vanilla beans",
      "Ugandan vanilla",
      "Vanilla planifolia",
      "Vanilla curing",
      "Grade A and Grade B vanilla",
      "Vanilla extract",
      "Vanilla powder",
      "Vanilla caviar",
      "Wholesale vanilla",
    ],
    sameAs: brandSameAs(),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: BRAND.name,
    description: BRAND.tagline,
    inLanguage: "en-US",
    publisher: { "@id": STORE_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/shop?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLdScript data={{ "@context": "https://schema.org", "@graph": [store, parent, website] }} />;
}

export function ProductJsonLd({ product }: { product: Product }) {
  const image =
    product.image && !product.image.startsWith("data:") ? [absolute(product.image)] : [`${BASE_URL}/opengraph-image`];
  const url = `${BASE_URL}${productHref(product)}`;

  const properties = [
    ["Grade", product.grade],
    ["Species", product.species],
    ["Bean length", product.beanLength],
    ["Moisture", product.moisture],
    ["Harvest", product.harvest],
    ["Aroma", product.profile?.aroma],
    ["Flavor", product.profile?.flavor],
    ["Best uses", product.profile?.uses],
  ].filter(([, value]) => value);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    image,
    description: product.description || `${product.name}, ${product.category.toLowerCase()} from ${BRAND.name}.`,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.producer || BRAND.name },
    category: product.category,
    ...(product.size ? { size: product.size } : {}),
    ...(product.origin ? { countryOfOrigin: { "@type": "Country", name: product.origin } } : {}),
    ...(properties.length
      ? {
          additionalProperty: properties.map(([name, value]) => ({
            "@type": "PropertyValue",
            name,
            value,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.numericPrice.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": STORE_ID },
      shippingDetails: shippingDetails(product.numericPrice),
      hasMerchantReturnPolicy: returnPolicy,
    },
  };

  return <JsonLdScript data={schema} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.url),
    })),
  };

  return <JsonLdScript data={schema} />;
}

/** Question-and-answer content that is also visible on the page. */
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <JsonLdScript data={schema} />;
}

/** A content page (about, guide, service) described for search and AI answer engines. */
export function WebPageJsonLd({
  type = "WebPage",
  path,
  name,
  description,
  image,
  about,
}: {
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage";
  path: string;
  name: string;
  description: string;
  image?: string;
  about?: string[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absolute(path)}#webpage`,
    url: absolute(path),
    name,
    description,
    inLanguage: "en-US",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    publisher: { "@id": STORE_ID },
    ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: absolute(image) } } : {}),
    ...(about ? { about: about.map((name) => ({ "@type": "Thing", name })) } : {}),
  };
  return <JsonLdScript data={schema} />;
}

/** The wholesale programme as a B2B service offered by the store. */
export function WholesaleServiceJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}/wholesale#service`,
    name: "Wholesale & bulk vanilla supply",
    serviceType: "Wholesale vanilla supply",
    url: `${BASE_URL}/wholesale`,
    description: `Trade pricing, volume discounts, PO numbers and Net-30 invoicing on vanilla beans, extract, powder and caviar for bakeries, manufacturers and distributors, sourced direct from ${PARENT.name}.`,
    provider: { "@id": STORE_ID },
    areaServed: { "@type": "Country", name: "United States" },
    audience: { "@type": "BusinessAudience", audienceType: "Bakeries, food manufacturers, restaurants, distributors" },
  };
  return <JsonLdScript data={schema} />;
}
