import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { fetchProductWithFallback } from '@/lib/graphql';
import { ProductDetail } from '@/components/ProductDetail';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  readonly params: Promise<{ readonly sku: string }>;
}

/**
 * Product detail page. Returns 404 when the SKU is unknown to both the live
 * API and the fallback catalog. Renders the fallback SKU silently when the
 * API is unreachable — but the warning banner calls that out.
 */
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps): Promise<React.ReactElement> {
  const { sku } = await params;
  const { product, usedFallback, notFound: missing } =
    await fetchProductWithFallback(sku);

  if (missing || !product) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
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
            <p className="font-semibold">
              Showing cached data — live API unavailable
            </p>
            <p className="text-xs text-muted-foreground">
              The Node GraphQL API did not respond. This product was loaded
              from the bundled fixture catalog.
            </p>
            <Link
              href="/products"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Browse all products
            </Link>
          </div>
        </div>
      ) : null}

      <ProductDetail product={product} />
    </div>
  );
}