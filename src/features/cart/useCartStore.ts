"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const key = `${item.product_id}::${item.variant_id}::${item.size}`;
          const existing = state.items.find((entry) => entry.key === key);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((entry) =>
                entry.key === key
                  ? { ...entry, quantity: Math.min(20, entry.quantity + item.quantity) }
                  : entry
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, { ...item, key }],
          };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.key !== key),
        })),

      updateQuantity: (key, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((entry) => entry.key !== key),
            };
          }
          return {
            items: state.items.map((entry) =>
              entry.key === key
                ? { ...entry, quantity: Math.min(20, quantity) }
                : entry
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "topstore-woman-cart-v1",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
