/** Invoice types, presets and totals — shared by the dashboard and the API. */
import { BRAND, PARENT } from "@/lib/brand";
import { roundCents } from "@/utils/currency";

export const INVOICE_STATUSES = ["Draft", "Sent", "Partially Paid", "Paid", "Void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  issuer: string;
  billTo: string;
  shipTo: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  poNumber: string;
  quantityLabel: string;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  shipping: number;
  amountPaid: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
  paymentDetails: string;
  deliveryDetails: string;
  notes: string;
  orderId: string | null;
  createdAt: string;
}

export type InvoiceDraft = Omit<Invoice, "id" | "subtotal" | "taxAmount" | "total" | "balanceDue" | "createdAt">;

/** Issuing entities ("From" block) with their default payment details. */
export const INVOICE_ISSUERS = [
  {
    id: "usa",
    label: `${BRAND.legalName} (USA)`,
    issuer: [BRAND.legalName, `${BRAND.address.street}, ${BRAND.address.unit}`, `${BRAND.address.city}, ${BRAND.address.stateName} ${BRAND.address.zip}`, BRAND.phone].join("\n"),
    paymentDetails: "",
  },
  {
    id: "uganda",
    label: "IK FOOD (U) LTD (Uganda)",
    issuer: ["IK FOOD (U) LTD", `${PARENT.poBox}, ${PARENT.street}`, `${PARENT.city}, ${PARENT.country}`, PARENT.phone].join("\n"),
    paymentDetails: [
      "Bank Name: Equity Bank Uganda Limited",
      "Branch: Kajjansi",
      "Beneficiary Name: IK Food (U) Ltd",
      "UGX Account Number: 1010202542422",
      "USD Account: 1010202542426",
      "SWIFT Code: EQBLUGKA",
    ].join("\n"),
  },
] as const;

export const PAYMENT_TERM_OPTIONS = [
  "Payment before delivery",
  "Due on receipt",
  "Net 15",
  "Net 30",
  "50% deposit, 50% before shipment",
] as const;

export const lineAmount = (item: InvoiceItem) => roundCents((Number(item.quantity) || 0) * (Number(item.rate) || 0));

/**
 * Totals: subtotal − discount, then tax on the discounted amount, then shipping.
 * Balance due = total − amount paid (never negative).
 */
export function computeInvoiceTotals(d: Pick<InvoiceDraft, "items" | "taxRate" | "discount" | "shipping" | "amountPaid">) {
  const subtotal = roundCents(d.items.reduce((sum, item) => sum + lineAmount(item), 0));
  const discount = Math.min(subtotal, Math.max(0, Number(d.discount) || 0));
  const taxAmount = roundCents((subtotal - discount) * ((Number(d.taxRate) || 0) / 100));
  const total = roundCents(subtotal - discount + taxAmount + Math.max(0, Number(d.shipping) || 0));
  const balanceDue = roundCents(Math.max(0, total - Math.max(0, Number(d.amountPaid) || 0)));
  return { subtotal, discount, taxAmount, total, balanceDue };
}

/** Status implied by payments, unless the invoice is a draft or void. */
export function statusFromPayment(status: InvoiceStatus, total: number, amountPaid: number): InvoiceStatus {
  if (status === "Draft" || status === "Void") return status;
  if (total > 0 && amountPaid >= total) return "Paid";
  if (amountPaid > 0) return "Partially Paid";
  return status === "Paid" || status === "Partially Paid" ? "Sent" : status;
}

export function isOverdue(inv: Pick<Invoice, "status" | "dueDate" | "balanceDue">) {
  if (!inv.dueDate || inv.balanceDue <= 0 || inv.status === "Draft" || inv.status === "Void") return false;
  return inv.dueDate < new Date().toISOString().slice(0, 10);
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "symbol" }).format(amount || 0);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function emptyInvoiceDraft(): InvoiceDraft {
  const issueDate = todayISO();
  return {
    invoiceNumber: "",
    status: "Draft",
    currency: "USD",
    issuer: INVOICE_ISSUERS[0].issuer,
    billTo: "",
    shipTo: "",
    customerEmail: "",
    issueDate,
    dueDate: addDaysISO(issueDate, 7),
    paymentTerms: PAYMENT_TERM_OPTIONS[0],
    poNumber: "",
    quantityLabel: "Quantity (kg)",
    items: [{ description: "", quantity: 1, rate: 0 }],
    taxRate: 0,
    discount: 0,
    shipping: 0,
    amountPaid: 0,
    paymentDetails: INVOICE_ISSUERS[0].paymentDetails,
    deliveryDetails: "",
    notes: "",
    orderId: null,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapInvoice(r: any): Invoice {
  return {
    id: String(r.id),
    invoiceNumber: r.invoice_number,
    status: r.status || "Draft",
    currency: r.currency || "USD",
    issuer: r.issuer || "",
    billTo: r.bill_to || "",
    shipTo: r.ship_to || "",
    customerEmail: r.customer_email || "",
    issueDate: r.issue_date || "",
    dueDate: r.due_date || "",
    paymentTerms: r.payment_terms || "",
    poNumber: r.po_number || "",
    quantityLabel: r.quantity_label || "Qty",
    items: Array.isArray(r.items) ? r.items : [],
    taxRate: Number(r.tax_rate || 0),
    discount: Number(r.discount || 0),
    shipping: Number(r.shipping || 0),
    amountPaid: Number(r.amount_paid || 0),
    subtotal: Number(r.subtotal || 0),
    taxAmount: Number(r.tax_amount || 0),
    total: Number(r.total || 0),
    balanceDue: Number(r.balance_due || 0),
    paymentDetails: r.payment_details || "",
    deliveryDetails: r.delivery_details || "",
    notes: r.notes || "",
    orderId: r.order_id || null,
    createdAt: r.created_at || "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

