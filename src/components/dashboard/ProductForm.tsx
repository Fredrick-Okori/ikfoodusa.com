"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImageIcon, Loader2, Plus, Save, Trash2, UploadCloud, Video, X } from "lucide-react";
import { Product, PRODUCT_PLACEHOLDER_IMAGE } from "@/data/products";
import { DEFAULT_CATEGORY, VANILLA_SPECIES } from "@/lib/catalog";
import { useCategories } from "@/lib/useCatalog";
import { isVideoMedia } from "@/components/FastVideo";
import { ProductImage } from "@/components/ProductImage";
import { compressImageFile } from "@/utils/media";
import { formatUSD } from "@/utils/currency";

export interface ProductFormValues {
  name: string;
  producer: string;
  origin: string;
  category: string;
  subcategory: string;
  species: string;
  grade: string;
  size: string;
  beanLength: string;
  moisture: string;
  harvest: string;
  numericPrice: string;
  compareAtPrice: string;
  buyingPrice: string;
  stockQuantity: string;
  badge: string;
  sku: string;
  image: string;
  description: string;
  aroma: string;
  flavor: string;
  uses: string;
  storage: string;
  isActive: boolean;
  priceTiers: { minQty: string; price: string }[];
  wholesalePrice: string;
  wholesaleMinQty: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  producer: "IK Foods USA",
  origin: "",
  category: DEFAULT_CATEGORY,
  subcategory: "",
  species: "Planifolia",
  grade: "",
  size: "",
  beanLength: "",
  moisture: "",
  harvest: "",
  numericPrice: "",
  compareAtPrice: "",
  buyingPrice: "",
  stockQuantity: "0",
  badge: "",
  sku: "",
  image: "",
  description: "",
  aroma: "",
  flavor: "",
  uses: "",
  storage: "",
  isActive: true,
  priceTiers: [],
  wholesalePrice: "",
  wholesaleMinQty: "1",
};

export function productToFormValues(p: Product & { isActive?: boolean }): ProductFormValues {
  return {
    name: p.name || "",
    producer: p.producer || "",
    origin: p.origin || "",
    category: p.category || DEFAULT_CATEGORY,
    subcategory: p.subcategory || "",
    species: p.species || "",
    grade: p.grade || "",
    size: p.size || "",
    beanLength: p.beanLength || "",
    moisture: p.moisture || "",
    harvest: p.harvest || "",
    numericPrice: String(p.numericPrice ?? ""),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    buyingPrice: String(p.buyingPrice ?? ""),
    stockQuantity: String(p.stockQuantity ?? 0),
    badge: p.badge || "",
    sku: p.sku || "",
    image: p.image === PRODUCT_PLACEHOLDER_IMAGE ? "" : p.image || "",
    description: p.description || "",
    aroma: p.profile?.aroma || "",
    flavor: p.profile?.flavor || "",
    uses: p.profile?.uses || "",
    storage: p.profile?.storage || "",
    isActive: p.isActive !== false,
    priceTiers: (p.priceTiers || []).map((t) => ({ minQty: String(t.minQty), price: String(t.price) })),
    wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : "",
    wholesaleMinQty: String(p.wholesaleMinQty || 1),
  };
}

/** Shape the form state into the JSON body accepted by /api/store-products. */
export function formValuesToBody(v: ProductFormValues) {
  return {
    name: v.name,
    producer: v.producer,
    origin: v.origin,
    category: v.category,
    subcategory: v.subcategory,
    species: v.species,
    grade: v.grade,
    size: v.size,
    beanLength: v.beanLength,
    moisture: v.moisture,
    harvest: v.harvest,
    numericPrice: Number(v.numericPrice || 0),
    compareAtPrice: Number(v.compareAtPrice || 0),
    buyingPrice: Number(v.buyingPrice || 0),
    stockQuantity: Number(v.stockQuantity || 0),
    badge: v.badge,
    sku: v.sku,
    image: v.image,
    description: v.description,
    isActive: v.isActive,
    priceTiers: v.priceTiers
      .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
      .filter((t) => t.minQty >= 2 && t.price > 0),
    wholesalePrice: Number(v.wholesalePrice || 0),
    wholesaleMinQty: Number(v.wholesaleMinQty || 1),
    profile: { aroma: v.aroma, flavor: v.flavor, uses: v.uses, storage: v.storage },
  };
}

const input =
  "h-11 w-full rounded-2xl border border-beige-200 bg-white px-4 text-sm text-forest-950 outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10";
const label = "mb-1.5 block text-xs font-bold text-forest-950";
const hint = "mt-1 block text-[11px] text-[#71717a]";
const section = "space-y-4 border-t border-beige-100 pt-6 first:border-t-0 first:pt-0";
const sectionTitle = "text-xs font-extrabold uppercase tracking-wider text-[#8e8e8e]";

export function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const { categories } = useCategories(true);
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const bind = (key: keyof ProductFormValues) => ({
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value),
  });

  const selectedCategory = categories.find((c) => c.name === values.category);
  const price = Number(values.numericPrice || 0);
  const cost = Number(values.buyingPrice || 0);
  const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  const readFile = (file: File) => {
    setError("");
    if (file.type.startsWith("video/")) {
      if (file.size > 8 * 1024 * 1024) {
        setError("Videos must be under 8 MB. Paste a hosted video URL for larger files.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => set("image", String(reader.result));
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("image/")) {
      compressImageFile(file)
        .then((dataUrl) => set("image", dataUrl))
        .catch(() => setError("Unable to process that image."));
    } else {
      setError("Please choose an image or video file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (price <= 0) {
      setError("Selling price must be greater than $0.");
      return;
    }
    if (values.priceTiers.some((t) => Number(t.price) >= price)) {
      setError("Volume tier prices should be lower than the retail selling price.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setSuccess("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-beige-200 bg-white p-6 shadow-2xs sm:p-8">
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-forest-200 bg-forest-50 p-4 text-sm font-bold text-forest-800">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      )}

      <div className={section}>
        <h2 className={sectionTitle}>1. Product</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className={label}>Product name *</label>
            <input id="pf-name" required placeholder="e.g. Grade A Planifolia Vanilla Beans" className={input} {...bind("name")} />
          </div>
          <div>
            <label htmlFor="pf-category" className={label}>Category *</label>
            <select id="pf-category" className={input} {...bind("category")}>
              {categories.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                  {c.isActive ? "" : " (hidden)"}
                </option>
              ))}
              {!categories.some((c) => c.name === values.category) && <option value={values.category}>{values.category}</option>}
            </select>
            <span className={hint}>
              Manage categories in <Link href="/dashboard/categories" className="underline">Categories</Link>.
            </span>
          </div>
          <div>
            <label htmlFor="pf-sub" className={label}>Subcategory</label>
            <input id="pf-sub" list="pf-sub-options" className={input} placeholder="Optional" {...bind("subcategory")} />
            <datalist id="pf-sub-options">
              {selectedCategory?.subcategories.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="pf-producer" className={label}>Brand / farm</label>
            <input id="pf-producer" className={input} {...bind("producer")} />
          </div>
          <div>
            <label htmlFor="pf-origin" className={label}>Origin</label>
            <input id="pf-origin" placeholder="e.g. Madagascar, Uganda, Tahiti" className={input} {...bind("origin")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-description" className={label}>Description</label>
            <textarea
              id="pf-description"
              rows={4}
              placeholder="What makes this vanilla special — how it's cured, how it smells, how customers should use it."
              className="w-full rounded-2xl border border-beige-200 bg-white p-4 text-sm text-forest-950 outline-none focus:border-forest-600"
              {...bind("description")}
            />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>2. Photo or video</h2>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) readFile(e.dataTransfer.files[0]);
          }}
          className={`relative flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed p-6 text-center transition sm:flex-row sm:text-left ${
            isDragging ? "border-forest-600 bg-forest-50" : "border-beige-300 bg-beige-50"
          }`}
        >
          <input
            type="file"
            accept="image/*,video/*"
            aria-label="Upload product photo or video"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-beige-200 bg-white">
            <ProductImage src={values.image || undefined} alt="Product preview" />
          </div>
          <div className="flex-1">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-forest-950 sm:justify-start">
              {values.image ? (
                isVideoMedia(values.image) ? <Video size={16} /> : <ImageIcon size={16} />
              ) : (
                <UploadCloud size={16} />
              )}
              {values.image ? "Drop a new file or click to replace" : "Drag & drop, or click to upload"}
            </p>
            <p className="mt-1 text-xs text-[#71717a]">JPG, PNG, WEBP or AVIF images (auto-compressed) · MP4/WebM video under 8 MB</p>
          </div>
          {values.image && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                set("image", "");
              }}
              className="relative z-10 rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600"
              aria-label="Remove media"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <div>
          <label htmlFor="pf-image-url" className={label}>…or paste an image / video URL</label>
          <input
            id="pf-image-url"
            placeholder="https://…"
            className={input}
            value={values.image.startsWith("data:") ? "" : values.image}
            onChange={(e) => set("image", e.target.value)}
          />
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>3. Vanilla specs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="pf-size" className={label}>Pack size *</label>
            <input id="pf-size" required placeholder="e.g. 10 beans · 4 fl oz · 100 g" className={input} {...bind("size")} />
          </div>
          <div>
            <label htmlFor="pf-grade" className={label}>Grade</label>
            <input id="pf-grade" list="pf-grade-options" placeholder="e.g. Grade A / Gourmet" className={input} {...bind("grade")} />
            <datalist id="pf-grade-options">
              <option value="Grade A / Gourmet" />
              <option value="Grade B / Extract" />
              <option value="Splits & Cuts" />
              <option value="Single Fold" />
              <option value="Double Fold" />
            </datalist>
          </div>
          <div>
            <label htmlFor="pf-species" className={label}>Species</label>
            <input id="pf-species" list="pf-species-options" className={input} {...bind("species")} />
            <datalist id="pf-species-options">
              {VANILLA_SPECIES.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="pf-length" className={label}>Bean length</label>
            <input id="pf-length" placeholder="e.g. 16–18 cm" className={input} {...bind("beanLength")} />
          </div>
          <div>
            <label htmlFor="pf-moisture" className={label}>Moisture</label>
            <input id="pf-moisture" placeholder="e.g. 30–35%" className={input} {...bind("moisture")} />
          </div>
          <div>
            <label htmlFor="pf-harvest" className={label}>Harvest</label>
            <input id="pf-harvest" placeholder="e.g. 2025" className={input} {...bind("harvest")} />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>4. Pricing &amp; stock (USD)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="pf-price" className={label}>Selling price *</label>
            <input id="pf-price" type="number" min="0" step="0.01" required inputMode="decimal" onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("numericPrice")} />
          </div>
          <div>
            <label htmlFor="pf-compare" className={label}>Compare-at price</label>
            <input id="pf-compare" type="number" min="0" step="0.01" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("compareAtPrice")} />
            <span className={hint}>Shown struck through when higher</span>
          </div>
          <div>
            <label htmlFor="pf-cost" className={label}>Cost price</label>
            <input id="pf-cost" type="number" min="0" step="0.01" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("buyingPrice")} />
            <span className={hint}>
              {price > 0 ? `Margin ${formatUSD(Math.max(0, price - cost))} (${margin}%)` : "Used for profit reports"}
            </span>
          </div>
          <div>
            <label htmlFor="pf-stock" className={label}>Quantity in stock *</label>
            <input id="pf-stock" type="number" min="0" step="1" required onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("stockQuantity")} />
          </div>
          <div>
            <label htmlFor="pf-sku" className={label}>SKU</label>
            <input id="pf-sku" placeholder="e.g. VAN-A-10" className={input} {...bind("sku")} />
          </div>
          <div>
            <label htmlFor="pf-badge" className={label}>Badge</label>
            <input id="pf-badge" placeholder="e.g. Best seller, New harvest" className={input} {...bind("badge")} />
          </div>
          <label className="flex items-center gap-3 self-end rounded-2xl border border-beige-200 px-4 py-3 text-sm font-bold text-forest-950 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-forest-700"
            />
            Visible on storefront
          </label>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>5. Business pricing (B2B)</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className={label}>Volume pricing (everyone)</p>
              <p className="text-[11px] text-[#71717a]">Lower unit price once a shopper buys at least this many units.</p>
            </div>
            {values.priceTiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  step="1"
                  aria-label="Minimum quantity"
                  placeholder="Min qty"
                  value={tier.minQty}
                  onChange={(e) =>
                    set("priceTiers", values.priceTiers.map((t, j) => (j === i ? { ...t, minQty: e.target.value } : t)))
                  }
                  className={`${input} w-28`}
                />
                <span className="text-xs text-[#71717a]">+ units at $</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  aria-label="Unit price"
                  placeholder="Price"
                  value={tier.price}
                  onChange={(e) =>
                    set("priceTiers", values.priceTiers.map((t, j) => (j === i ? { ...t, price: e.target.value } : t)))
                  }
                  className={`${input} w-32`}
                />
                <button
                  type="button"
                  onClick={() => set("priceTiers", values.priceTiers.filter((_, j) => j !== i))}
                  aria-label="Remove tier"
                  className="rounded-full p-2 text-[#71717a] hover:bg-red-50 hover:text-red-600"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("priceTiers", [...values.priceTiers, { minQty: "", price: "" }])}
              className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 px-4 py-2 text-xs font-bold text-forest-900 hover:bg-beige-50"
            >
              <Plus size={14} /> Add tier
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className={label}>Trade price (approved trade accounts)</p>
              <p className="text-[11px] text-[#71717a]">Hidden from the public. Applied at checkout once the account code is verified.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pf-trade" className={label}>Trade price</label>
                <input id="pf-trade" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Optional" onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("wholesalePrice")} />
              </div>
              <div>
                <label htmlFor="pf-trade-min" className={label}>Minimum units</label>
                <input id="pf-trade-min" type="number" min="1" step="1" onWheel={(e) => e.currentTarget.blur()} className={input} {...bind("wholesaleMinQty")} />
              </div>
            </div>
            {Number(values.wholesalePrice) > 0 && cost > 0 && (
              <p className="text-[11px] text-[#71717a]">
                Trade margin {formatUSD(Math.max(0, Number(values.wholesalePrice) - cost))}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>6. Flavor profile &amp; use</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-aroma" className={label}>Aroma</label>
            <input id="pf-aroma" placeholder="e.g. Creamy, sweet, hints of cocoa" className={input} {...bind("aroma")} />
          </div>
          <div>
            <label htmlFor="pf-flavor" className={label}>Flavor</label>
            <input id="pf-flavor" placeholder="e.g. Rich, smooth, rum-raisin finish" className={input} {...bind("flavor")} />
          </div>
          <div>
            <label htmlFor="pf-uses" className={label}>Best uses</label>
            <input id="pf-uses" placeholder="e.g. Custards, ice cream, homemade extract" className={input} {...bind("uses")} />
          </div>
          <div>
            <label htmlFor="pf-storage" className={label}>Storage</label>
            <input id="pf-storage" placeholder="e.g. Airtight jar, cool dark place" className={input} {...bind("storage")} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-beige-100 pt-6">
        <Link
          href="/dashboard/products"
          className="rounded-full border border-beige-200 bg-white px-6 py-3 text-sm font-semibold text-forest-950 transition hover:bg-beige-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-full bg-forest-900 px-7 py-3 text-sm font-bold text-beige-50 transition hover:bg-forest-800 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
