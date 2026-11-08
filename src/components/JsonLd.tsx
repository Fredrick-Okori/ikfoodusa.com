import { Product, productHref } from "@/data/products";
import { BRAND, PARENT } from "@/lib/brand";

const BASE_URL = BRAND.url;

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inlined; data comes from our own catalog, with "<" escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function StoreJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${BASE_URL}/#store`,
    name: BRAND.name,
    url: BASE_URL,
    logo: `${BASE_URL}/logo_clean.webp`,
    description: BRAND.description,
    legalName: BRAND.legalName,
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
    parentOrganization: {
      "@type": "Organization",
      name: PARENT.name,
      url: PARENT.url,
      email: PARENT.email,
      telephone: PARENT.phoneE164,
      address: {
        "@type": "PostalAddress",
        postOfficeBoxNumber: PARENT.poBox.replace("P.O. Box ", ""),
        streetAddress: PARENT.street,
        addressLocality: PARENT.city,
        addressCountry: "UG",
      },
    },
    currenciesAccepted: "USD",
    areaServed: { "@type": "Country", name: "United States" },
    sameAs: Object.values(BRAND.social),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: BRAND.name,
    description: BRAND.tagline,
    publisher: { "@id": `${BASE_URL}/#store` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/shop?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLdScript data={organization} />
      <JsonLdScript data={website} />
    </>
  );
}

export function ProductJsonLd({ product }: { product: Product }) {
  const image = product.image && !product.image.startsWith("data:")
    ? [product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`]
    : [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image,
    description: product.description || `${product.name} — ${product.category} from ${BRAND.name}.`,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.producer || BRAND.name },
    category: product.category,
    ...(product.size ? { size: product.size } : {}),
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}${productHref(product)}`,
      priceCurrency: "USD",
      price: product.numericPrice.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${BASE_URL}/#store` },
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
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return <JsonLdScript data={schema} />;
}
