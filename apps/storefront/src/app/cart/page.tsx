'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '@/components/CartItem';
import { CartSummary } from '@/components/CartSummary';
import { useCartStore } from '@/lib/cart';

/**
 * Cart page. The cart contents live in Zustand (persisted to localStorage),
 * which is browser-only, so the page renders as a client component and
 * reads from the store on mount.
 */
export default function CartPage(): React.ReactElement {
  const items = useCartStore((state) => state.items);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your cart
        </h1>
        <p className="text-sm text-muted-foreground">
          Adjust quantities or remove items before checkout.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-10 text-center">
              <ShoppingBag
                className="mx-auto h-10 w-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Your cart is empty.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div
              className="flex flex-col gap-3"
              role="list"
              aria-label="Cart items"
            >
              {items.map((item) => (
                <div key={item.product.sku} role="listitem">
                  <CartItem item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}