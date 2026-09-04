'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart';

interface CartSummaryProps {
  readonly className?: string;
}

const TAX_RATE = 0.08;

function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

/**
 * Cart totals panel — subtotal, estimated tax, grand total. Renders only on
 * the client (it subscribes to the Zustand store).
 */
export function CartSummary({
  className,
}: CartSummaryProps): React.ReactElement {
  const items = useCartStore((state) => state.items);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );
  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const isEmpty = items.length === 0;

  return (
    <aside
      className={`rounded-lg border border-border bg-card p-5 ${className ?? ''}`}
      aria-label="Order summary"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Order summary
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt>
            Subtotal{' '}
            <span className="text-xs text-muted-foreground">
              ({itemCount} item{itemCount === 1 ? '' : 's'})
            </span>
          </dt>
          <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>
            Estimated tax{' '}
            <span className="text-xs text-muted-foreground">
              ({(TAX_RATE * 100).toFixed(0)}%)
            </span>
          </dt>
          <dd className="font-medium tabular-nums">{formatPrice(tax)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-bold tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>

      {isEmpty ? (
        <div className="mt-5 rounded-md border border-dashed border-border bg-secondary/30 p-6 text-center">
          <ShoppingBag
            className="mx-auto h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm text-muted-foreground">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <Link
          href="/checkout"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Proceed to checkout
        </Link>
      )}
    </aside>
  );
}