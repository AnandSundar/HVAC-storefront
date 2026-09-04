import type { Product, ProductCategory } from '@hvac-portfolio/shared-data/types';
import { ProductCard } from '@/components/ProductCard';

interface ProductGridProps {
  readonly products: readonly Product[];
  readonly className?: string;
}

/**
 * Responsive product grid. Tiles wrap on 1 / 2 / 3 / 4 columns at the standard
 * Tailwind widths (mobile / sm / md / lg).
 */
export function ProductGrid({
  products,
  className,
}: ProductGridProps): React.ReactElement {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className ?? ''}`}
      role="list"
      aria-label="Product list"
    >
      {products.map((product) => (
        <div key={product.sku} role="listitem">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

/**
 * Returns products bucketed by category while preserving a stable category
 * order. Categories without products are omitted from the result.
 */
export function groupProductsByCategory(
  products: readonly Product[],
): ReadonlyArray<{
  readonly category: ProductCategory;
  readonly products: readonly Product[];
}> {
  const buckets = new Map<ProductCategory, Product[]>();
  for (const product of products) {
    const bucket = buckets.get(product.category);
    if (bucket) {
      bucket.push(product);
    } else {
      buckets.set(product.category, [product]);
    }
  }
  return Array.from(buckets.entries()).map(([category, items]) => ({
    category,
    products: items,
  }));
}