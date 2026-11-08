"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { storageKey } from "@/lib/brand";
import { shippingFor } from "@/lib/promotions";
import { roundCents } from "@/utils/currency";
import { PriceTier, unitPriceFor } from "@/lib/pricing";

export interface CartItem {
  id: string;
  name: string;
  producer: string;
  category: string;
  numericPrice: number;
  image: string;
  quantity: number;
  size?: string;
  stockQuantity?: number;
  priceTiers?: PriceTier[];
}

export interface CartAddResult {
  success: boolean;
  message?: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  addToCart: (product: Product, quantityToAdd?: number) => CartAddResult;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_STORAGE_KEY = storageKey("cart_items");

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem;
  return Boolean(item && typeof item.id === "string" && typeof item.numericPrice === "number" && item.quantity > 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydratedCart, setHasHydratedCart] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setItems(stored.filter(isCartItem));
    } catch (error) {
      console.warn("Failed to restore cart:", error);
    } finally {
      setHasHydratedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedCart) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to persist cart:", error);
    }
  }, [hasHydratedCart, items]);

  const addToCart = (product: Product, quantityToAdd = 1): CartAddResult => {
    const stockQuantity = product.stockQuantity;
    if (!product.inStock || stockQuantity === 0) {
      return { success: false, message: `${product.name} is out of stock.` };
    }

    const existing = items.find((item) => item.id === product.id);
    const currentQuantity = existing?.quantity ?? 0;
    if (typeof stockQuantity === "number" && currentQuantity + quantityToAdd > stockQuantity) {
      return {
        success: false,
        message: `Only ${stockQuantity} ${stockQuantity === 1 ? "unit" : "units"} of ${product.name} available.`,
      };
    }

    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === product.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + quantityToAdd,
          priceTiers: product.priceTiers,
          numericPrice: product.numericPrice,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          producer: product.producer,
          category: product.category,
          numericPrice: product.numericPrice,
          image: product.image,
          quantity: quantityToAdd,
          size: product.size,
          stockQuantity,
          priceTiers: product.priceTiers,
        },
      ];
    });

    return { success: true };
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const limited = typeof item.stockQuantity === "number" ? Math.min(quantity, item.stockQuantity) : quantity;
        return { ...item, quantity: limited };
      })
    );
  };

  const clearCart = () => setItems([]);

  const count = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => roundCents(items.reduce((acc, item) => acc + unitPriceFor(item, item.quantity).price * item.quantity, 0)),
    [items]
  );
  const shippingFee = shippingFor(subtotal);
  const grandTotal = roundCents(subtotal + shippingFee);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        shippingFee,
        grandTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart: () => router.push("/cart"),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
