/** Shared B2B (wholesale) types and constants — safe to import on client and server. */

export const TRADE_ACCOUNT_STATUSES = ["Pending", "Approved", "Rejected", "Suspended"] as const;
export type TradeAccountStatus = (typeof TRADE_ACCOUNT_STATUSES)[number];

export const QUOTE_STATUSES = ["New", "Contacted", "Quoted", "Won", "Lost"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const BUSINESS_TYPES = [
  "Bakery / Pastry",
  "Ice cream / Dairy",
  "Restaurant / Café",
  "Food & beverage manufacturer",
  "Extract / Flavor producer",
  "Distributor / Importer",
  "Retailer / Specialty store",
  "Cosmetics / Fragrance",
  "Other",
] as const;

export const ORDER_FREQUENCIES = ["One-off", "Monthly", "Quarterly", "Annual contract"] as const;

export type CustomerType = "B2C" | "B2B";

export interface TradeAccount {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  taxId: string;
  website: string;
  address: string;
  expectedVolume: string;
  message: string;
  status: TradeAccountStatus;
  accountCode: string | null;
  netTerms: boolean;
  internalNotes: string;
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  products: string;
  quantity: string;
  frequency: string;
  deliveryLocation: string;
  message: string;
  status: QuoteStatus;
  internalNotes: string;
  createdAt: string;
}

/** What the checkout learns about a verified trade account. */
export interface VerifiedTradeAccount {
  id: string;
  companyName: string;
  contactName: string;
  netTerms: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapTradeAccount(r: any): TradeAccount {
  return {
    id: String(r.id),
    companyName: r.company_name || "",
    contactName: r.contact_name || "",
    email: r.email || "",
    phone: r.phone || "",
    businessType: r.business_type || "",
    taxId: r.tax_id || "",
    website: r.website || "",
    address: r.address || "",
    expectedVolume: r.expected_volume || "",
    message: r.message || "",
    status: r.status || "Pending",
    accountCode: r.account_code || null,
    netTerms: Boolean(r.net_terms),
    internalNotes: r.internal_notes || "",
    createdAt: r.created_at || new Date().toISOString(),
  };
}

export function mapQuoteRequest(r: any): QuoteRequest {
  return {
    id: String(r.id),
    companyName: r.company_name || "",
    contactName: r.contact_name || "",
    email: r.email || "",
    phone: r.phone || "",
    products: r.products || "",
    quantity: r.quantity || "",
    frequency: r.frequency || "",
    deliveryLocation: r.delivery_location || "",
    message: r.message || "",
    status: r.status || "New",
    internalNotes: r.internal_notes || "",
    createdAt: r.created_at || new Date().toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Short, unambiguous code staff email to an approved business, e.g. IKT-7K4Q9M. */
export function generateAccountCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `IKT-${code}`;
}

/** Trim and cap free-text input from public forms. */
export function cleanText(value: unknown, max = 500): string {
  return String(value ?? "").trim().slice(0, max);
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
