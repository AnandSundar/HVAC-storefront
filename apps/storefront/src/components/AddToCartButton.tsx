'use client';

import { useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from '@hvac-portfolio/shared-data/types';
import { useCartStore } from '@/lib/cart';

/** Local cn helper (clsx + tailwind-merge) to keep file count tight. */
const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

interface AddToCartButtonProps {
  readonly product: Product;
  readonly disabled?: boolean;
  readonly className?: string;
}

const MAX_QUANTITY_PER_LINE = 99;

/**
 * Add-to-Cart control. Quantity stepper plus a primary action button that
 * pushes the chosen quantity into the Zustand cart store and flashes a
 * confirmation state.
 */
export function AddToCartButton({
  product,
  disabled = false,
  className,
}: AddToCartButtonProps): React.ReactElement {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleDecrement = (): void => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleIncrement = (): void => {
    setQuantity((q) => Math.min(MAX_QUANTITY_PER_LINE, q + 1));
  };

  const handleAdd = (): void => {
    if (disabled) return;
    addItem(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-md border border-border bg-background">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className="inline-flex h-9 min-w-12 items-center justify-center border-x border-border px-3 text-sm font-medium tabular-nums"
            aria-live="polite"
            aria-label={`Quantity ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || quantity >= MAX_QUANTITY_PER_LINE}
            aria-label="Increase quantity"
            className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className={cn(
            'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors sm:flex-none',
            disabled
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : justAdded
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}