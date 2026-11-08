"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  EyeOff,
  Leaf,
} from "lucide-react";
import { Product } from "@/data/products";
import { formatUSD } from "@/utils/currency";
import { ProductImage } from "@/components/ProductImage";
import { useCategories } from "@/lib/useCatalog";

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { categories: categoryList } = useCategories(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/store-products?all=1", { cache: "no-store" });
      const data = await res.json();
      setProductsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to fetch products:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdjustStock = async (productId: string, delta: number) => {
    const product = productsList.find((p) => p.id === productId);
    if (!product) return;
    const updatedStock = Math.max(0, (product.stockQuantity ?? 0) + delta);
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: updatedStock, inStock: updatedStock > 0 && p.isActive } : p))
    );

    try {
      const res = await fetch(`/api/store-products?id=${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: updatedStock }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch (err) {
      console.warn("Failed to update stock:", err);
      setActionError(`Couldn't update stock for ${product.name}. Refresh and try again.`);
      setProductsList((prev) => prev.map((p) => (p.id === productId ? product : p)));
    }
  };

  const handleDelete = async (productId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/store-products?id=${encodeURIComponent(productId)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error("delete failed");
      setProductsList((prev) => prev.filter((p) => String(p.id) !== productId));
    } catch (err) {
      console.warn("Failed to delete product:", err);
      setActionError("Couldn't delete that product. Please try again.");
    }
    setIsDeleting(false);
    setDeleteConfirmId(null);
  };

  const categories = ["All", ...categoryList.map((c) => c.name)];

  const filteredProducts = productsList.filter((p) => {
    const matchesCat = productCategoryFilter === "All" || p.category === productCategoryFilter;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.producer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight">Products</h1>
          <p className="text-xs text-[#71717a] mt-1">
            Add vanilla products, adjust stock and control what shows on the storefront.
          </p>
        </div>
        <Link
          href="/dashboard/products/create"
          className="rounded-full bg-forest-900 hover:bg-forest-800 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Add product
        </Link>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setProductCategoryFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                productCategoryFilter === cat
                  ? "bg-forest-900 text-white shadow-2xs"
                  : "bg-white text-[#71717a] border border-beige-200 hover:border-forest-950"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory..."
            className="w-full h-9 rounded-full border border-beige-200 bg-white pl-9 pr-4 text-xs outline-none focus:border-forest-700"
          />
        </div>
      </div>

      {actionError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          {actionError}
          <button onClick={() => setActionError(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <p className="text-xs text-[#71717a] font-semibold animate-pulse">Loading inventory…</p>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-beige-200 bg-white py-20 text-center gap-3">
          <Leaf size={36} className="text-forest-400" />
          <p className="font-bold text-sm text-forest-950">No products yet</p>
          <p className="text-xs text-[#71717a]">Add your first vanilla product to publish it to the storefront.</p>
          <Link
            href="/dashboard/products/create"
            className="mt-2 rounded-full bg-forest-900 px-5 py-2 text-xs font-bold text-white hover:bg-forest-800 transition"
          >
            + Add product
          </Link>
        </div>
      )}

      {/* Product Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const stock = p.stockQuantity ?? 0;
          const isLowStock = stock > 0 && stock <= 10;
          const isConfirmingDelete = deleteConfirmId === p.id;

          return (
            <div
              key={p.id}
              className="rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-forest-700/40 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-beige-200 bg-beige-50">
                  <ProductImage src={p.image} alt={p.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-block rounded-full bg-beige-100 px-2.5 py-0.5 text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
                      {p.category}
                    </span>
                    {!p.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e4e4e7] px-2 py-0.5 text-[10px] font-bold text-[#52525b]">
                        <EyeOff size={10} /> Hidden
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-bold text-forest-950 truncate mt-1">{p.name}</h3>
                  <p className="text-xs text-[#71717a] truncate">{[p.size, p.grade, p.origin].filter(Boolean).join(" · ")}</p>
                  <p className="font-sans text-base font-extrabold text-forest-700 mt-0.5 tracking-tight">
                    {formatUSD(p.numericPrice)}
                  </p>
                  <p className="text-[11px] text-[#71717a]">
                    Cost {formatUSD(p.buyingPrice)} · Margin {formatUSD(Math.max(0, p.numericPrice - p.buyingPrice))}
                  </p>
                </div>
              </div>

              {/* Stock Controls */}
              <div className="pt-4 border-t border-beige-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${stock > 0 ? "bg-forest-500" : "bg-red-500"}`} />
                    <span className="text-xs font-bold text-forest-950">
                      Stock: <span className="font-sans text-xs font-bold text-forest-950">{stock}</span> units
                    </span>
                  </div>
                  {isLowStock && (
                    <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> Low Stock Alert
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-beige-100 p-1 rounded-full border border-[#e4e4e7]">
                  <button
                    onClick={() => handleAdjustStock(p.id, -1)}
                    aria-label={`Decrease stock of ${p.name}`}
                    className="h-7 w-7 rounded-full bg-white text-forest-950 hover:bg-neutral-200 transition flex items-center justify-center font-bold shadow-2xs"
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    onClick={() => handleAdjustStock(p.id, 1)}
                    aria-label={`Increase stock of ${p.name}`}
                    className="h-7 w-7 rounded-full bg-white text-forest-950 hover:bg-neutral-200 transition flex items-center justify-center font-bold shadow-2xs"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Edit & Delete Actions */}
              <div className="pt-3 border-t border-beige-100">
                {isConfirmingDelete ? (
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-bold text-red-700">Delete this product?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-full border border-beige-200 bg-white px-3 py-1 text-xs font-bold text-forest-950 hover:bg-beige-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={isDeleting}
                        className="rounded-full bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-bold text-white transition disabled:opacity-60"
                      >
                        {isDeleting ? "Deleting…" : "Confirm"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-bold text-forest-950 hover:border-forest-700 hover:text-forest-700 transition"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-beige-200 bg-white px-4 py-2 text-xs font-bold text-forest-950 hover:border-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={12} /> Delete
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
