"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  EMPTY_PRODUCT_FORM,
  ProductForm,
  ProductFormValues,
  formValuesToBody,
} from "@/components/dashboard/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();

  const handleCreate = async (values: ProductFormValues) => {
    const res = await fetch("/api/store-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToBody(values)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || "Failed to create product.");
    router.push("/dashboard/products");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#71717a] transition hover:text-forest-950"
      >
        <ArrowLeft size={16} /> Back to products
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-forest-950">Add a product</h1>
        <p className="mt-1 text-sm text-[#71717a]">
          New products appear on the storefront as soon as they&apos;re saved, visible and in stock.
        </p>
      </div>
      <ProductForm initialValues={EMPTY_PRODUCT_FORM} submitLabel="Add product" onSubmit={handleCreate} />
    </div>
  );
}
