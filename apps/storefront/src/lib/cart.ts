import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@hvac-portfolio/shared-data/types';

/**
 * A single line in the cart: the product reference plus the chosen quantity.
 * We store the full product snapshot (not just a SKU) so the cart renders
 * without re-querying the API on every navigation.
 */
export interface CartLineItem {
  readonly product: Product;
  readonly quantity: number;
}

interface CartState {
  readonly items: readonly CartLineItem[];
}

interface CartActions {
  readonly addItem: (product: Product, quantity?: number) => void;
  readonly removeItem: (sku: string) => void;
  readonly updateQty: (sku: string, quantity: number) => void;
  readonly clearCart: () => void;
  readonly getCount: () => number;
  readonly getSubtotal: () => number;
}

export type CartStore = CartState & CartActions;

const STORAGE_KEY = 'hvac-cart';

function lineSubtotal(item: CartLineItem): number {
  return item.product.price * item.quantity;
}

/**
 * Zustand cart store with `persist` middleware. Survives reloads via the
 * `hvac-cart` localStorage key.
 *
 * Server-side rendering is safe: the store factory checks `typeof window`
 * before touching storage, so the initial server snapshot is always empty.
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const qty = Math.max(1, Math.floor(quantity));
        const existing = get().items.find((i) => i.product.sku === product.sku);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.sku === product.sku
                ? { product: i.product, quantity: i.quantity + qty }
                : i,
            ),
          });
        } else {
          set({
            items: [...get().items, { product, quantity: qty }],
          });
        }
      },

      removeItem: (sku) => {
        set({ items: get().items.filter((i) => i.product.sku !== sku) });
      },

      updateQty: (sku, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product.sku !== sku) });
          return;
        }
        const qty = Math.floor(quantity);
        set({
          items: get().items.map((i) =>
            i.product.sku === sku ? { product: i.product, quantity: qty } : i,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((total, item) => total + lineSubtotal(item), 0),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // No-op storage on the server; the first client render will hydrate
          // from real localStorage. Zustand calls this factory only at hydration.
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/**
 * Helper for SSR/utility contexts where you want a one-shot subtotal without
 * subscribing to the store. Reads the persisted snapshot directly.
 */
export function calculateSubtotal(items: readonly CartLineItem[]): number {
  return items.reduce((total, item) => total + lineSubtotal(item), 0);
}

export function calculateCount(items: readonly CartLineItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}