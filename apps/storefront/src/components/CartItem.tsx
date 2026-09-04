'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import type { CartLineItem } from '@/lib/cart';
import { useCartStore } from '@/lib/cart';

interface CartItemProps {
  readonly item: CartLineItem;
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
 * Single line in the cart: product preview, quantity controls, line total.
 * Updates the Zustand store directly — no client-side state to reconcile.
 */
export function CartItem({
  item,
  className,
}: CartItemProps): React.ReactElement {
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const { product, quantity } = item;
  const lineTotal = product.price * quantity;

  return (
    <article className={`flex items-start gap-4 rounded-lg border border-border bg-card p-4 ${className ?? ''}`}>
      <Link
        href={`/products/${product.sku}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground"
        aria-label={`View ${product.name}`}
      >
        <Package className="h-8 w-8" aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Link
              href={`/products/${product.sku}`}
              className="text-sm font-semibold leading-snug hover:underline"
            >
              {product.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {product.sku} · {product.manufacturer}
            </span>
          </div>
          <button
            type="button"
            onClick={() => removeItem(product.sku)}
            aria-label={`Remove ${product.name} from cart`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="inline-flex items-center rounded-md border border-border bg-background">
            <button
              type="button"
              onClick={() => updateQty(product.sku, quantity - 1)}
              disabled={quantity <= 1}
              aria-label={`Decrease quantity of ${product.name}`}
              className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span
              className="inline-flex h-8 min-w-10 items-center justify-center border-x border-border px-2 text-sm font-medium tabular-nums"
              aria-label={`Quantity ${quantity}`}
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQty(product.sku, quantity + 1)}
              aria-label={`Increase quantity of ${product.name}`}
              className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {formatPrice(lineTotal)}
            </div>
            {quantity > 1 ? (
              <div className="text-xs text-muted-foreground">
                {formatPrice(product.price)} each
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}