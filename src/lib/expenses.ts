import { supabase } from "@/lib/supabase";

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amountUSD: number;
  recordedBy: string;
  paymentMethod: string;
  voucherNumber: string;
  date: string;
  status: "Approved" | "Pending" | "Reimbursed";
  notes?: string;
}

const EXPENSES_CACHE_TTL_MS = 30_000; // 30 seconds memory cache
let expensesCache: { expenses: ExpenseItem[]; expiresAt: number } | null = null;
let expensesRequest: Promise<ExpenseItem[]> | null = null;
let lastKnownGoodExpenses: ExpenseItem[] = [];

export function invalidateExpensesCache() {
  expensesCache = null;
  expensesRequest = null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseExpense(exp: any): ExpenseItem {
  return {
    id: String(exp.id),
    title: exp.title || "Expense",
    category: exp.category || "Operations",
    amountUSD: Number(exp.amount_usd || 0),
    recordedBy: exp.recorded_by || "Staff",
    paymentMethod: exp.payment_method || "Company Card",
    voucherNumber: exp.voucher_number || `VCH-${exp.id}`,
    date: exp.date || new Date().toISOString().slice(0, 10),
    status: exp.status || "Approved",
    notes: exp.notes || "",
  };
}

/**
 * High-performance cached expenses getter with in-flight request deduplication.
 */
export async function getExpensesCatalog(): Promise<ExpenseItem[]> {
  const cached = expensesCache;
  if (cached && cached.expiresAt > Date.now() && cached.expenses.length > 0) {
    return cached.expenses;
  }

  if (expensesRequest) return expensesRequest;

  expensesRequest = (async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.warn("Supabase expenses query notice:", error.message);
        return lastKnownGoodExpenses;
      }

      const mapped = (data || []).map(mapSupabaseExpense);
      if (mapped.length > 0) {
        lastKnownGoodExpenses = mapped;
      }
      return mapped;
    } catch (err) {
      console.warn("Expenses fetch exception:", err);
      return lastKnownGoodExpenses;
    }
  })();

  try {
    const expenses = await expensesRequest;
    expensesCache = { expenses, expiresAt: Date.now() + EXPENSES_CACHE_TTL_MS };
    return expenses;
  } finally {
    expensesRequest = null;
  }
}

