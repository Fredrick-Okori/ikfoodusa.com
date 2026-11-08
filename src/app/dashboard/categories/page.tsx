"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  DatabaseZap,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Product, categoryHref } from "@/data/products";
import { Category, DEFAULT_CATEGORIES } from "@/lib/catalog";
import { useCategories } from "@/lib/useCatalog";

interface Draft {
  id?: string;
  name: string;
  description: string;
  subcategories: string;
}

const emptyDraft: Draft = { name: "", description: "", subcategories: "" };

async function api(method: string, body?: unknown, id?: string) {
  const res = await fetch(`/api/categories${id ? `?id=${encodeURIComponent(id)}` : ""}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function CategoriesPage() {
  const { categories, isLoading, reload } = useCategories(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/store-products?all=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  // Categories without ids are the built-in defaults: the table is empty or unreachable.
  const usingDefaults = categories.length > 0 && categories.every((c) => !c.id);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [products]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const body = {
      name: draft.name,
      description: draft.description,
      subcategories: draft.subcategories,
      ...(draft.id ? {} : { displayOrder: categories.length + 1 }),
    };
    run(async () => {
      await api(draft.id ? "PATCH" : "POST", body, draft.id);
      setDraft(null);
    });
  };

  const seedDefaults = () =>
    run(async () => {
      for (const c of DEFAULT_CATEGORIES) {
        await api("POST", {
          name: c.name,
          description: c.description,
          subcategories: c.subcategories,
          displayOrder: c.displayOrder,
        });
      }
    });

  const move = (category: Category, direction: -1 | 1) => {
    const index = categories.findIndex((c) => c.id === category.id);
    const swap = categories[index + direction];
    if (!swap?.id || !category.id) return;
    run(async () => {
      await api("PATCH", { displayOrder: swap.displayOrder }, category.id);
      await api("PATCH", { displayOrder: category.displayOrder }, swap.id);
    });
  };

  const remove = (category: Category) => {
    if (!category.id) return;
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    run(() => api("DELETE", undefined, category.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Categories</h1>
          <p className="mt-1 text-xs text-[#71717a]">
            Categories drive the storefront menu, shop filters and the product form. Hidden categories stay out of the
            storefront menu.
          </p>
        </div>
        <button
          onClick={() => setDraft(emptyDraft)}
          disabled={usingDefaults}
          className="flex items-center gap-1.5 self-start rounded-full bg-forest-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-forest-800 disabled:opacity-40 sm:self-auto"
        >
          <Plus size={16} /> New category
        </button>
      </div>

      {usingDefaults && !isLoading && (
        <div className="flex flex-col gap-4 rounded-3xl border border-beige-300 bg-beige-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <DatabaseZap size={20} className="mt-0.5 shrink-0 text-forest-700" />
            <div>
              <p className="text-sm font-bold text-forest-950">Showing the built-in vanilla categories</p>
              <p className="mt-0.5 text-xs text-[#71717a]">
                The categories table is empty or not set up yet. Run <code>supabase_schema.sql</code>, or save these
                defaults to the database to start editing them.
              </p>
            </div>
          </div>
          <button
            onClick={seedDefaults}
            disabled={busy}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-forest-800 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />} Save defaults to database
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {draft && (
        <form onSubmit={saveDraft} className="space-y-4 rounded-3xl border border-forest-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-forest-950">{draft.id ? "Edit category" : "New category"}</h2>
            <button type="button" onClick={() => setDraft(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-beige-100">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cat-name" className="mb-1.5 block text-xs font-bold text-forest-950">Name *</label>
              <input
                id="cat-name"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Vanilla Paste"
                className="h-11 w-full rounded-2xl border border-beige-200 px-4 text-sm outline-none focus:border-forest-600"
              />
              {draft.id && (
                <span className="mt-1 block text-[11px] text-[#71717a]">Renaming also updates products in this category.</span>
              )}
            </div>
            <div>
              <label htmlFor="cat-subs" className="mb-1.5 block text-xs font-bold text-forest-950">Subcategories</label>
              <input
                id="cat-subs"
                value={draft.subcategories}
                onChange={(e) => setDraft({ ...draft, subcategories: e.target.value })}
                placeholder="Comma separated, e.g. Single Fold, Double Fold"
                className="h-11 w-full rounded-2xl border border-beige-200 px-4 text-sm outline-none focus:border-forest-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-desc" className="mb-1.5 block text-xs font-bold text-forest-950">Description</label>
              <textarea
                id="cat-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Shown on the storefront category header and home page."
                className="w-full rounded-2xl border border-beige-200 p-4 text-sm outline-none focus:border-forest-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-beige-200 px-5 py-2.5 text-xs font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-forest-800 disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Save category
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, index) => {
          const count = counts.get(category.name) || 0;
          const editable = Boolean(category.id);
          return (
            <div
              key={category.id || category.slug}
              className={`flex flex-col justify-between gap-5 rounded-3xl border bg-white p-6 shadow-2xs transition ${
                category.isActive ? "border-beige-200" : "border-dashed border-beige-300 opacity-70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-900 text-secondary">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-forest-950">{category.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                        {count} {count === 1 ? "product" : "products"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      category.isActive ? "bg-secondary-light text-forest-800" : "bg-[#e4e4e7] text-[#52525b]"
                    }`}
                  >
                    {category.isActive ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#71717a]">{category.description || "No description yet."}</p>
                {category.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-beige-100 pt-3">
                    {category.subcategories.map((sub) => (
                      <span key={sub} className="rounded-lg border border-beige-200 bg-beige-50 px-2 py-0.5 text-[10px] font-medium text-[#52525b]">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-beige-100 pt-3">
                <Link
                  href={categoryHref(category.name)}
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-bold text-[#71717a] hover:text-forest-950"
                >
                  Storefront <ExternalLink size={12} />
                </Link>
                {editable && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(category, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move ${category.name} up`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-beige-100 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => move(category, 1)}
                      disabled={busy || index === categories.length - 1}
                      aria-label={`Move ${category.name} down`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-beige-100 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => run(() => api("PATCH", { isActive: !category.isActive }, category.id))}
                      disabled={busy}
                      aria-label={category.isActive ? `Hide ${category.name}` : `Show ${category.name}`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-beige-100"
                    >
                      {category.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() =>
                        setDraft({
                          id: category.id,
                          name: category.name,
                          description: category.description,
                          subcategories: category.subcategories.join(", "),
                        })
                      }
                      aria-label={`Edit ${category.name}`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-beige-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(category)}
                      disabled={busy}
                      aria-label={`Delete ${category.name}`}
                      className="rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
