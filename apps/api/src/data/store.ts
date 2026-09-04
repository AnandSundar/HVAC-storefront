import { products as seedProducts } from '@hvac-portfolio/shared-data/products';
import type { Product, ProductCategory } from '@hvac-portfolio/shared-data/types';
import { seedStore } from './seed.js';

/**
 * In-memory product store seeded once at boot from packages/shared-data fixtures.
 * State is NOT persisted across restarts. For a 4-day demo this is intentional —
 * production would back this with a real database (Postgres via Prisma).
 */
const products: Product[] = seedStore();

/** Returns every product, optionally filtered by category. */
export function getAllProducts(category?: string | null): Product[] {
  if (!category) {
    return [...products];
  }
  return products.filter((p) => p.category === (category as ProductCategory));
}

/** Returns one product by SKU, or undefined if missing. */
export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

/** Append a new product to the store. Returns the inserted product. */
export function addProduct(product: Product): Product {
  products.push(product);
  return product;
}

/** Count products — useful for tests. */
export function productCount(): number {
  return products.length;
}

/** Re-seed the store from fixtures — for tests only. */
export function resetStore(): void {
  products.length = 0;
  products.push(...seedStore());
}

/** Test-only: confirm the seed loader has the expected fixture size. */
export function seedFixtureSize(): number {
  return seedProducts.length;
}