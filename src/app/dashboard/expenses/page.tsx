"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  User,
  X,
} from "lucide-react";
import { formatUSD, parseUSD } from "@/utils/currency";
import { storageKey } from "@/lib/brand";

const EXPENSE_CATEGORIES = [
  "Vanilla Sourcing",
  "Packaging & Labels",
  "Shipping & Fulfillment",
  "Marketing",
  "Software & Fees",
  "Operations",
  "Staff",
] as const;

const EXPENSE_PAYMENT_METHODS = ["Company Card", "Bank Transfer / ACH", "PayPal", "Cash"] as const;

interface ExpenseItem {
  id: string;
  title: string;
  category: (typeof EXPENSE_CATEGORIES)[number];
  amountUSD: number;
  recordedBy: string;
  paymentMethod: (typeof EXPENSE_PAYMENT_METHODS)[number];
  voucherNumber: string;
  date: string;
  status: "Approved" | "Pending" | "Reimbursed";
  notes?: string;
}

const initialExpenses: ExpenseItem[] = [];

const CATEGORIES = ["All Categories", ...EXPENSE_CATEGORIES] as const;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseItem["category"]>(EXPENSE_CATEGORIES[0]);
  const [amountUSD, setAmountUSD] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem["paymentMethod"]>(EXPENSE_PAYMENT_METHODS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [voucherNumber, setVoucherNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Load from API and Supabase
  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const data = await res.json();
      setExpenses(Array.isArray(data?.docs) ? data.docs : []);
    } catch (err) {
      console.warn("Failed to fetch expenses from API:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadExpenses();
    try {
      setRecordedBy(localStorage.getItem(storageKey("user_name")) || localStorage.getItem(storageKey("user_email")) || "");
    } catch {}
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseUSD(amountUSD);
    if (!title.trim() || amount <= 0) {
      setFormError("Enter a title and an amount greater than $0.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          amountUSD: amount,
          recordedBy: recordedBy.trim() || "Staff",
          paymentMethod,
          voucherNumber: voucherNumber.trim() || undefined,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to save expense");
      await loadExpenses();
      setTitle("");
      setAmountUSD("");
      setVoucherNumber("");
      setNotes("");
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));

    try {
      await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete expense from Supabase:", err);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: ExpenseItem["status"]) => {
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, status: newStatus } : exp)));

    try {
      await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn("Failed to patch expense in Supabase:", err);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.recordedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "All Categories" || exp.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" || exp.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [expenses, searchQuery, selectedCategory, selectedStatus]);

  // Calculations
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amountUSD, 0);
    const approved = filteredExpenses
      .filter((exp) => exp.status === "Approved")
      .reduce((sum, exp) => sum + exp.amountUSD, 0);
    const pending = filteredExpenses
      .filter((exp) => exp.status === "Pending")
      .reduce((sum, exp) => sum + exp.amountUSD, 0);

    return {
      total,
      approved,
      pending,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight">Expense Management</h1>
          <p className="text-xs text-[#71717a] mt-1">
            Track sourcing, packaging, shipping and operating costs (USD).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-forest-900 hover:bg-forest-800 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Total expenses</p>
          {isLoading ? (
            <div className="h-9 w-44 rounded-md bg-[#e4e4e7] animate-pulse my-1" />
          ) : (
            <p className="font-sans text-3xl font-extrabold tracking-tight text-forest-950">
              {formatUSD(stats.total)}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 bg-beige-50 border border-beige-200 px-2.5 py-0.5 rounded-full">
            <TrendingDown size={14} /> {isLoading ? "—" : `${stats.count} recorded vouchers`}
          </span>
        </div>

        <div className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Approved Disbursements</p>
          {isLoading ? (
            <div className="h-9 w-44 rounded-md bg-[#e4e4e7] animate-pulse my-1" />
          ) : (
            <p className="font-sans text-3xl font-extrabold tracking-tight text-emerald-800">
              {formatUSD(stats.approved)}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 size={14} /> Reconciled & Audited
          </span>
        </div>

        <div className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Pending Approval</p>
          {isLoading ? (
            <div className="h-9 w-44 rounded-md bg-[#e4e4e7] animate-pulse my-1" />
          ) : (
            <p className="font-sans text-3xl font-extrabold tracking-tight text-amber-800">
              {formatUSD(stats.pending)}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
            <Clock size={14} /> Manager Review Required
          </span>
        </div>

      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-3xl border border-beige-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense, employee, voucher..."
            className="w-full h-10 rounded-full border border-beige-200 bg-beige-50 pl-9 pr-4 text-xs outline-none focus:border-forest-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-full border border-beige-200 bg-beige-50 px-4 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-full border border-beige-200 bg-beige-50 px-4 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Reimbursed">Reimbursed</option>
          </select>
        </div>

      </div>

      {/* Expenses Table / List */}
      <div className="rounded-3xl border border-beige-200 bg-white shadow-2xs overflow-hidden">
        
        <div className="divide-y divide-beige-100">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71717a] font-medium">
              No expense records found matching your filters.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-5 hover:bg-[#fafaf9] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-forest-950 bg-beige-100 px-2 py-0.5 rounded border border-[#e4e4e7]">
                      {exp.voucherNumber}
                    </span>
                    <span className="rounded-full bg-beige-50 border border-beige-200 px-2.5 py-0.5 text-[10px] font-bold text-forest-700">
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-[#71717a]">· {exp.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-forest-950">{exp.title}</h3>
                  {exp.notes && (
                    <p className="text-xs text-[#71717a]">{exp.notes}</p>
                  )}

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-[#71717a]">
                    <span className="flex items-center gap-1 font-medium">
                      <User size={12} className="text-[#a1a1aa]" /> {exp.recordedBy}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-[#52525b]">{exp.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <p className="font-sans text-base font-extrabold text-forest-950 tracking-tight">
                      {formatUSD(exp.amountUSD)}
                    </p>
                    <span className="text-[11px] font-bold text-[#71717a]">{exp.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={exp.status}
                      onChange={(e) => handleToggleStatus(exp.id, e.target.value as any)}
                      className={`rounded-full px-3 py-1 text-xs font-bold border outline-none cursor-pointer ${
                        exp.status === "Approved"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : exp.status === "Pending"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Reimbursed">Reimbursed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-[#a1a1aa] hover:text-red-600 transition"
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* Modal: Record New Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 text-forest-950 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none">
            
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-forest-950">Record an expense</h3>
                <p className="text-xs text-[#71717a] mt-0.5">Submit operational expenditure for manager auditing</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-beige-100 text-[#71717a] hover:bg-[#e4e4e7] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-forest-950 block">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. VIP Courier Fuel Allowance"
                  className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-4 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-forest-950 block">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseItem["category"])}
                    className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-3 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-forest-950 block">Amount (USD) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-4 text-sm font-sans font-bold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-forest-950 block">Recorded by *</label>
                  <input
                    required
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-3 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-forest-950 block">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpenseItem["paymentMethod"])}
                    className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-3 text-xs font-semibold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                  >
                    {EXPENSE_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-forest-950 block">Voucher / Receipt Reference</label>
                <input
                  type="text"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  placeholder="e.g. VCH-9941"
                  className="w-full h-11 rounded-2xl border border-beige-200 bg-white px-4 text-xs font-mono font-semibold text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-forest-950 block">Auditing Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional context about the expenditure..."
                  className="w-full rounded-2xl border border-beige-200 bg-white p-3 text-xs text-forest-950 outline-none focus:border-forest-700 shadow-2xs"
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">
                  {formError}
                </p>
              )}

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full bg-beige-100 hover:bg-[#e4e4e7] px-5 py-2.5 text-xs font-bold text-[#52525b] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-forest-900 hover:bg-forest-800 px-6 py-2.5 text-xs font-bold text-white transition shadow-sm disabled:opacity-60"
                >
                  {isSaving ? "Saving…" : "Save expense"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

