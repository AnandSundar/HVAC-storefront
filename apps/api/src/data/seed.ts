import { products as seedProducts } from '@hvac-portfolio/shared-data/products';
import type { Product } from '@hvac-portfolio/shared-data/types';

/**
 * Loads the HVAC product fixtures into a fresh array. We deep-copy so
 * the store can mutate (push new products) without aliasing the shared
 * fixture module.
 */
export function seedStore(): Product[] {
  return seedProducts.map((p) => ({ ...p, specs: p.specs ? { ...p.specs } : undefined }));
}