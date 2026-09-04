import { products as sharedProducts } from '@hvac-portfolio/shared-data/products';
import type { Product } from '@hvac-portfolio/shared-data/types';

/**
 * Static product catalog used when the live Node GraphQL API is unreachable.
 *
 * The fixture data is imported from `@hvac-portfolio/shared-data/products` so
 * the fallback always matches the seed shipped with the API. This guarantees
 * the storefront renders meaningful content when the recruiter visits without
 * a backend running.
 */
export const fallbackProducts: readonly Product[] = sharedProducts;

/** Find a fallback product by SKU. Returns undefined if not found. */
export function findFallbackProduct(sku: string): Product | undefined {
  return fallbackProducts.find((p) => p.sku === sku);
}