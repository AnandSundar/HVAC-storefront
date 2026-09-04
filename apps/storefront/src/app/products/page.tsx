import { AlertTriangle } from 'lucide-react';
import { fetchProductsWithFallback } from '@/lib/graphql';
import { ProductGrid, groupProductsByCategory } from '@/components/ProductGrid';
import type { ProductCategory } from '@hvac-portfolio/shared-data/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Products',
  description: 'Browse HVAC parts grouped by category.',
};

/**
 * Product catalog page. Server-rendered with React Server Components; falls
 * back to the static fixture when the live GraphQL API is unreachable.
 */
export default async function ProductsPage(): Promise<React.ReactElement> {
  const { products, usedFallback } = await fetchProductsWithFallback();
  const grouped = groupProductsByCategory(products);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          HVAC Parts Catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          {products.length} products across {grouped.length} categories.
          Inventory data is queried live from the Node GraphQL API.
        </p>
      </header>

      {usedFallback ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Showing cached data — live API unavailable</p>
            <p className="text-xs text-muted-foreground">
              The Node GraphQL API did not respond. Rendering the bundled
              fixture catalog until the API is reachable again.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-10">
        {grouped.map(({ category, products: categoryProducts }) => (
          <section key={category} aria-labelledby={`category-${category}`}>
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2
                id={`category-${category}`}
                className="text-lg font-semibold tracking-tight sm:text-xl"
              >
                {category as ProductCategory}
              </h2>
              <span className="text-xs text-muted-foreground">
                {categoryProducts.length} product
                {categoryProducts.length === 1 ? '' : 's'}
              </span>
            </div>
            <ProductGrid products={categoryProducts} />
          </section>
        ))}
      </div>
    </div>
  );
}