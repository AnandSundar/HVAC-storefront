import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Package } from 'lucide-react';
import type { Product } from '@hvac-portfolio/shared-data/types';

/** Local cn helper (clsx + tailwind-merge) to keep file count tight. */
const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

interface ProductCardProps {
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
 * Compact product summary tile. Image placeholder, name, category badge,
 * formatted price, and stock indicator. Links to the detail page.
 */
export function ProductCard({
  product,
  className,
}: ProductCardProps): React.ReactElement {
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:border-foreground/20 hover:shadow-md',
        className,
      )}
    >
      <Link
        href={`/products/${product.sku}`}
        className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${product.name} – ${formatPrice(product.price)}`}
      >
        <div className="flex h-32 items-center justify-center bg-secondary/40 text-muted-foreground">
          <Package className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
              {product.category}
            </span>
            <span className="text-xs text-muted-foreground">{product.sku}</span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {product.name}
          </h3>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                !inStock && 'bg-destructive/10 text-destructive',
                lowStock && 'bg-warning/15 text-warning-foreground',
                inStock && !lowStock && 'bg-green-500/10 text-green-700 dark:text-green-400',
              )}
            >
              {!inStock ? 'Out of stock' : lowStock ? `${product.stock} left` : 'In stock'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}