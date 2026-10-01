import { create } from 'zustand';
import { api, ApiError } from './api';
import { effectivePrice } from './format';
import type { Cart, CartItem, CartPayload } from './types';

interface CartState {
  cart: Cart | null;
  items: CartItem[];
  itemsCount: number;
  totalAmount: number;
  warnings: string[];
  loading: boolean;
  /** Per-item ids currently mutating, so a row can show its own spinner. */
  pending: Set<number>;
  ready: boolean;

  load: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => void;
}

const EMPTY: Omit<CartState, 'load' | 'add' | 'setQuantity' | 'remove' | 'clear' | 'reset'> = {
  cart: null,
  items: [],
  itemsCount: 0,
  totalAmount: 0,
  warnings: [],
  loading: false,
  pending: new Set<number>(),
  ready: false,
};

function applyPayload(payload: CartPayload, set: (p: Partial<CartState>) => void) {
  const items = payload.cart?.items ?? [];
  set({
    cart: payload.cart,
    items,
    itemsCount: payload.itemsCount ?? items.length,
    totalAmount: payload.totalAmount ?? 0,
    warnings: (payload.stockIssues ?? []).map((i) => `${i.productName}: ${i.issue}`),
  });
}

export const useCart = create<CartState>((set, get) => ({
  ...EMPTY,

  load: async () => {
    // Not signed in — nothing to fetch, and a 401 would just be noise.
    if (!localStorage.getItem('pf.token')) {
      set({ ...EMPTY, ready: true });
      return;
    }
    set({ loading: true });
    try {
      const { data } = await api.get<{ success: boolean; data: CartPayload }>('/cart');
      applyPayload(data.data, set);
      set({ ready: true });
    } catch (err) {
      if (err instanceof ApiError && err.isAuth) {
        set({ ...EMPTY, ready: true });
        return;
      }
      set({ ready: true });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    const { data } = await api.post<{ success: boolean; data: CartPayload }>('/cart/add', {
      productId,
      quantity,
    });
    applyPayload(data.data, set);
  },

  setQuantity: async (itemId, quantity) => {
    const prev = get();
    // Optimistic: apply locally, roll back if the server disagrees.
    const item = prev.items.find((i) => i.id === itemId);
    const nextQty = Math.max(1, Math.min(99, quantity));
    if (!item || item.quantity === nextQty) return;

    const nextItems = prev.items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            quantity: nextQty,
            subtotal: effectivePrice(i.product.price ?? i.price, i.product.salePrice) * nextQty,
          }
        : i,
    );
    const nextTotal = nextItems.reduce((s, i) => s + i.subtotal, 0);
    set({
      items: nextItems,
      itemsCount: nextItems.reduce((s, i) => s + i.quantity, 0),
      totalAmount: nextTotal,
      pending: new Set(prev.pending).add(itemId),
    });

    try {
      const { data } = await api.put<{ success: boolean; data: CartPayload }>(`/cart/${itemId}`, {
        quantity: nextQty,
      });
      applyPayload(data.data, set);
    } catch (err) {
      await get().load(); // resync with server truth
      throw err;
    } finally {
      const p = new Set(get().pending);
      p.delete(itemId);
      set({ pending: p });
    }
  },

  remove: async (itemId) => {
    const prev = get();
    const remaining = prev.items.filter((i) => i.id !== itemId);
    const nextTotal = remaining.reduce((s, i) => s + i.subtotal, 0);
    set({
      items: remaining,
      itemsCount: remaining.reduce((s, i) => s + i.quantity, 0),
      totalAmount: nextTotal,
      pending: new Set(prev.pending).add(itemId),
    });

    try {
      const { data } = await api.delete<{ success: boolean; data: CartPayload }>(`/cart/${itemId}`);
      if (data.data) applyPayload(data.data, set);
    } catch (err) {
      await get().load();
      throw err;
    } finally {
      const p = new Set(get().pending);
      p.delete(itemId);
      set({ pending: p });
    }
  },

  clear: async () => {
    const { data } = await api.delete<{ success: boolean; data: CartPayload }>('/cart/clear');
    applyPayload(data.data, set);
  },

  reset: () => set({ ...EMPTY, ready: true }),
}));

/* -------------------------------------------------------------------------- */
/*  Derived                                                                    */
/* -------------------------------------------------------------------------- */

export const cartCount = (items: CartItem[]): number =>
  items.reduce((n, i) => n + i.quantity, 0);

/** Below this the backend charges a ₹40 delivery fee. */
export const FREE_DELIVERY_AT = 500;
export const DELIVERY_FEE = 40;
export const TAX_RATE = 0.18;

export function orderEstimate(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_AT || subtotal === 0 ? 0 : DELIVERY_FEE;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { subtotal, deliveryFee, tax, total: subtotal + deliveryFee + tax };
}
