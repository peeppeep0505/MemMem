import { create } from "zustand";
import type { Product } from "@/services/productService";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  category: string;
  rarity: string;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  addToCart: (product: Product) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleDrawer: (open?: boolean) => void;
  subtotal: () => number;
  tax: () => number;
  shipping: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isDrawerOpen: false,

  addToCart: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product._id);

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === product._id
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + 1, item.stock),
                }
              : item
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            productId: product._id,
            name: product.name,
            price: product.salePrice,
            quantity: 1,
            stock: product.stock,
            category: product.category,
            rarity: product.rarity,
            imageUrl: product.imageUrl,
          },
        ],
      };
    }),

  increaseQty: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.stock),
            }
          : item
      ),
    })),

  decreaseQty: (productId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),

  removeFromCart: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  clearCart: () => set({ items: [] }),

  toggleDrawer: (open) =>
    set((state) => ({
      isDrawerOpen: typeof open === "boolean" ? open : !state.isDrawerOpen,
    })),

  subtotal: () =>
    Number(
      get()
        .items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2)
    ),

  tax: () => Number((get().subtotal() * 0.07).toFixed(2)),

  shipping: () => (get().subtotal() >= 500 || get().items.length === 0 ? 0 : 35),

  total: () => Number((get().subtotal() + get().tax() + get().shipping()).toFixed(2)),
}));