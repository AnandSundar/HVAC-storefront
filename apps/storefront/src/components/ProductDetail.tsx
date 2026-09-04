import type { Product } from '@hvac-portfolio/shared-data/types';
import { Package, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AddToCartButton } from '@/components/AddToCartButton';

/** Local cn helper (clsx + tailwind-merge) to keep file count tight. */
const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

interface ProductDetailProps {
  readonly product: Product;
  readonly className?: string;
}

function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

/**
 * Full product detail view. Renders the product photo via next/image when
 * available, falls back to a placeholder icon when imageUrl is missing. Also
 * shows full description, specs list, stock indicator, price, and the
 * AddToCartButton.
 */
export function ProductDetail({
  product,
  className,
}: ProductDetailProps): React.ReactElement {
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 10;
  const specs = product.specs ? Object.entries(product.specs) : [];

  return (
    <article className={cn('grid gap-8 md:grid-cols-2', className)}>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40 text-muted-foreground">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        ) : (
          <Package className="h-24 w-24" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to catalog
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
            {product.category}
          </span>
          <span className="text-xs text-muted-foreground">{product.sku}</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {product.name}
        </h1>

        <p className="text-2xl font-bold text-foreground">
          {formatPrice(product.price)}
        </p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              !inStock && 'bg-destructive/10 text-destructive',
              lowStock && 'bg-warning/15 text-warning-foreground',
              inStock && !lowStock && 'bg-green-500/10 text-green-700 dark:text-green-400',
            )}
          >
            {!inStock
              ? 'Out of stock'
              : lowStock
                ? `Only ${product.stock} left in stock`
                : `${product.stock} in stock`}
          </span>
          <span className="text-xs text-muted-foreground">
            Manufacturer: {product.manufacturer}
          </span>
        </div>

        <AddToCartButton product={product} disabled={!inStock} />

        {specs.length > 0 ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold">Specifications</h2>
            <dl className="mt-2 divide-y divide-border rounded-md border border-border">
              {specs.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                >
                  <dt className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="text-right text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </article>
  );
}