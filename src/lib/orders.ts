import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import type { CustomerType } from "@/lib/b2b";

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Refunded";

export const ORDER_STATUSES: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid", "Refunded"];

export const PAYMENT_METHODS = [
  { id: "Card", label: "Credit / Debit Card", description: "We email a secure payment link once your order is confirmed." },
  { id: "PayPal", label: "PayPal", description: "We send a PayPal invoice to your email." },
  { id: "Zelle", label: "Zelle", description: "Payment instructions are emailed with your confirmation." },
  { id: "Invoice", label: "Net-30 Invoice", description: "For approved trade accounts with invoice terms." },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPriceUSD: number;
  subtotalUSD: number;
  unitBuyingPriceUSD?: number;
  /** How the unit price was set: retail, volume tier or trade account */
  priceSource?: "retail" | "volume" | "trade";
  grossProfitUSD?: number;
  developerProfitShareUSD?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  subtotalUSD: number;
  shippingUSD: number;
  discountUSD: number;
  totalAmountUSD: number;
  commissionRate: number;
  grossProfitUSD: number;
  developerProfitShareUSD: number;
  storeProfitUSD: number;
  notes?: string;
  customerType: CustomerType;
  companyName?: string;
  poNumber?: string;
  tradeAccountId?: string;
  items: OrderItem[];
  createdAt: string;
}

const ORDERS_CACHE_TTL_MS = 0;
let ordersCache: { orders: Order[]; expiresAt: number } | null = null;
let ordersRequest: Promise<Order[]> | null = null;
let lastKnownGoodOrders: Order[] = [];

export function invalidateOrdersCache() {
  ordersCache = null;
  ordersRequest = null;
}

export function generateOrderNumber() {
  return `${BRAND.orderPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseOrder(so: any): Order {
  return {
    id: String(so.id),
    orderNumber: so.order_number || `${BRAND.orderPrefix}-${so.id}`,
    customerName: so.customer_name || "Customer",
    customerEmail: so.customer_email || "",
    customerPhone: so.customer_phone || "",
    deliveryAddress: so.delivery_address || "",
    orderStatus: so.order_status || "Pending",
    paymentMethod: so.payment_method || "Card",
    paymentStatus: so.payment_status || "Pending",
    subtotalUSD: Number(so.subtotal_usd || 0),
    shippingUSD: Number(so.shipping_usd || 0),
    discountUSD: Number(so.discount_usd || 0),
    totalAmountUSD: Number(so.total_amount_usd || 0),
    commissionRate: Number(so.commission_rate ?? 0.25),
    grossProfitUSD: Number(so.gross_profit_usd || 0),
    developerProfitShareUSD: Number(so.developer_profit_share_usd || 0),
    storeProfitUSD: Number(so.store_profit_usd || 0),
    notes: so.notes || undefined,
    customerType: so.customer_type === "B2B" ? "B2B" : "B2C",
    companyName: so.company_name || undefined,
    poNumber: so.po_number || undefined,
    tradeAccountId: so.trade_account_id || undefined,
    items: Array.isArray(so.items) ? so.items : [],
    createdAt: so.created_at || new Date().toISOString(),
  };
}

/**
 * Cached orders getter with in-flight request deduplication.
 */
export async function getOrdersCatalog(): Promise<Order[]> {
  const cached = ordersCache;
  if (cached && cached.expiresAt > Date.now() && cached.orders.length > 0) {
    return cached.orders;
  }

  if (ordersRequest) return ordersRequest;

  ordersRequest = (async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase orders query notice:", error.message);
        return lastKnownGoodOrders;
      }

      const mapped = (data || []).map(mapSupabaseOrder);
      lastKnownGoodOrders = mapped;
      return mapped;
    } catch (err) {
      console.warn("Orders fetch exception:", err);
      return lastKnownGoodOrders;
    }
  })();

  try {
    const orders = await ordersRequest;
    ordersCache = { orders, expiresAt: Date.now() + ORDERS_CACHE_TTL_MS };
    return orders;
  } finally {
    ordersRequest = null;
  }
}
