import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@hvac-portfolio/shared-data/types';

/**
 * Unit tests for the Zustand cart store.
 *
 * Each test starts from a clean slate by clearing localStorage AND resetting
 * the module registry, which forces vitest to re-evaluate `cart.ts`. The
 * Zustand factory re-runs and builds a fresh store with `items: []`. The
 * first call to `addItem` writes to localStorage via the persist middleware,
 * which mirrors the browser behavior the storefront relies on.
 */

const fixtureProduct: Product = {
  id: 'p001',
  sku: 'TEST-001',
  name: 'Test Furnace',
  description: 'A test furnace used in unit tests.',
  price: 100.0,
  stock: 10,
  category: 'Furnaces',
  manufacturer: 'Acme',
};

const secondProduct: Product = {
  id: 'p002',
  sku: 'TEST-002',
  name: 'Test Filter',
  description: 'A test filter used in unit tests.',
  price: 25.5,
  stock: 50,
  category: 'Filters',
  manufacturer: 'Acme',
};

async function loadStore(): Promise<typeof import('../src/lib/cart').useCartStore> {
  const mod = await import('../src/lib/cart');
  return mod.useCartStore;
}

function resetLocalStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
}

beforeEach(() => {
  // Reset module graph so `cart.ts` re-evaluates. The Zustand factory runs
  // again and constructs a fresh store. Without this, all tests share the
  // singleton from the first import — and items leak between tests.
  vi.resetModules();
  resetLocalStorage();
});

afterEach(() => {
  vi.resetModules();
  resetLocalStorage();
});

describe('cart store', () => {
  it('starts empty', async () => {
    const store = await loadStore();
    expect(store.getState().items).toHaveLength(0);
    expect(store.getState().getCount()).toBe(0);
    expect(store.getState().getSubtotal()).toBe(0);
  });

  it('addItem appends a new line', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct);
    const items = store.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.product.sku).toBe('TEST-001');
    expect(items[0]?.quantity).toBe(1);
  });

  it('addItem with quantity > 1 sets the initial quantity', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 3);
    expect(store.getState().items[0]?.quantity).toBe(3);
  });

  it('addItem increments the quantity for an existing SKU', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 2);
    store.getState().addItem(fixtureProduct, 3);
    const items = store.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('addItem floors fractional quantities to 1', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 0.5);
    expect(store.getState().items[0]?.quantity).toBe(1);
  });

  it('addItem with qty 0 still adds a 1-line (defensive default)', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 0);
    expect(store.getState().items[0]?.quantity).toBe(1);
  });

  it('removeItem drops the matching SKU', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct);
    store.getState().addItem(secondProduct);
    store.getState().removeItem('TEST-001');
    const items = store.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.product.sku).toBe('TEST-002');
  });

  it('removeItem is a no-op when the SKU is absent', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct);
    store.getState().removeItem('DOES-NOT-EXIST');
    expect(store.getState().items).toHaveLength(1);
  });

  it('updateQty replaces the line quantity', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 1);
    store.getState().updateQty('TEST-001', 7);
    expect(store.getState().items[0]?.quantity).toBe(7);
  });

  it('updateQty with 0 removes the line', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 1);
    store.getState().updateQty('TEST-001', 0);
    expect(store.getState().items).toHaveLength(0);
  });

  it('updateQty with negative value removes the line', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 1);
    store.getState().updateQty('TEST-001', -3);
    expect(store.getState().items).toHaveLength(0);
  });

  it('clearCart empties the store', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct);
    store.getState().addItem(secondProduct);
    store.getState().clearCart();
    expect(store.getState().items).toHaveLength(0);
  });

  it('getCount sums quantities across all lines', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 2);
    store.getState().addItem(secondProduct, 5);
    expect(store.getState().getCount()).toBe(7);
  });

  it('getSubtotal multiplies price by quantity and sums across lines', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 2); // 100 * 2 = 200
    store.getState().addItem(secondProduct, 4); // 25.5 * 4 = 102
    expect(store.getState().getSubtotal()).toBeCloseTo(302.0, 2);
  });

  it('cart persists across simulated page reload', async () => {
    // First session: add items, which triggers persist middleware to write
    // to localStorage.
    const first = await loadStore();
    first.getState().addItem(fixtureProduct, 2);
    first.getState().addItem(secondProduct, 3);

    // The store's getState().items should match the in-memory state.
    expect(first.getState().items).toHaveLength(2);
    expect(first.getState().getSubtotal()).toBeCloseTo(276.5, 2);

    // Simulate a hard reload by re-importing the module. Zustand will
    // rehydrate from localStorage on construction.
    const second = await loadStore();
    const items = second.getState().items;
    expect(items).toHaveLength(2);

    const first1 = items.find((i) => i.product.sku === 'TEST-001');
    const second1 = items.find((i) => i.product.sku === 'TEST-002');
    expect(first1?.quantity).toBe(2);
    expect(second1?.quantity).toBe(3);

    expect(second.getState().getCount()).toBe(5);
    expect(second.getState().getSubtotal()).toBeCloseTo(276.5, 2);
  });

  it('helper functions produce consistent counts and subtotals', async () => {
    const store = await loadStore();
    store.getState().addItem(fixtureProduct, 3);
    store.getState().addItem(secondProduct, 2);

    const items = store.getState().items;
    const cartMod = await import('../src/lib/cart');
    expect(cartMod.calculateCount(items)).toBe(5);
    expect(cartMod.calculateSubtotal(items)).toBeCloseTo(351.0, 2);
  });
});