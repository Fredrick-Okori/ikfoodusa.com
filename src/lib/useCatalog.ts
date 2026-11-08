"use client";

import { useEffect, useState } from "react";
import { Product } from "@/data/products";
import { Category, DEFAULT_CATEGORIES, fetchCategories } from "@/lib/catalog";

/** Load the live product catalog from /api/store-products. */
export function useStoreProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/store-products", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
      })
      .then((data) => {
        if (active) setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn("Failed to load store products:", err);
        if (active) setError(err instanceof Error ? err.message : "Unable to load products");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { products, isLoading, error };
}

/** Load the category list (falls back to the built-in vanilla categories). */
export function useCategories(includeInactive = false) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  const reload = () => {
    setIsLoading(true);
    return fetchCategories(includeInactive)
      .then(setCategories)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetchCategories(includeInactive)
      .then((list) => {
        if (active) setCategories(list);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [includeInactive]);

  return { categories, isLoading, reload };
}
