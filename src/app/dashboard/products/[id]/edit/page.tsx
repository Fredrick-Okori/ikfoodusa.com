"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Product, productHref } from "@/data/products";
import {
  ProductForm,
  ProductFormValues,
  formValuesToBody,
  productToFormValues,
} from "@/components/dashboard/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/store-products?all=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((list: Product[]) => {
        const found = Array.isArray(list) ? list.find((p) => String(p.id) === String(id)) : undefined;
        if (found) setProduct(found);
        else setLoadError("Product not found.");
      })
      .catch(() => setLoadError("Failed to load product."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async (values: ProductFormValues) => {
    const res = await fetch(`/api/store-products?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToBody(values)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || "Failed to update product.");
    if (data.product) setProduct(data.product);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#71717a] transition hover:text-forest-950"
        >
          <ArrowLeft size={16} /> Back to products
        </Link>
        {product && (
          <Link
            href={productHref(product)}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:underline"
          >
            View on storefront <ExternalLink size={13} />
          </Link>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Edit product</h1>
        {product && <p className="mt-1 text-sm text-[#71717a]">{product.name}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-3xl border border-beige-200 bg-white p-8 text-sm text-[#71717a]">
          <Loader2 size={16} className="animate-spin" /> Loading product…
        </div>
      ) : loadError || !product ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-800">{loadError}</div>
      ) : (
        <ProductForm
          key={product.id}
          initialValues={productToFormValues(product)}
          submitLabel="Save changes"
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
