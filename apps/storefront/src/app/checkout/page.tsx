'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/cart';

type CheckoutStatus = 'review' | 'submitting' | 'success';

function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

/**
 * Mock checkout. The page is a client component because the cart state lives
 * in Zustand / localStorage, which is browser-only. After 1.5s of "processing"
 * we show a success state and clear the cart. No real payment integration
 * (KTD-7).
 */
export default function CheckoutPage(): React.ReactElement {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [status, setStatus] = useState<CheckoutStatus>('review');

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );

  // If the user lands here via a deep link with an empty cart, render the
  // empty-state immediately rather than trying to "submit" nothing.
  useEffect(() => {
    if (status === 'success' && items.length === 0) {
      // success screen handles its own copy
    }
  }, [items.length, status]);

  const handlePlaceOrder = (): void => {
    if (status !== 'review') return;
    setStatus('submitting');
    setTimeout(() => {
      clearCart();
      setStatus('success');
    }, 1500);
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
            <Check className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Order placed successfully!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a demo checkout. No real payment was processed and no order
            has been recorded on the backend. The cart has been cleared.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/products"
              className="inline-flex h-10 items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-10 text-center">
          <ShoppingBag
            className="mx-auto h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Your cart is empty. Add a product before checking out.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your order and complete the mock checkout.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="order-heading"
          className="rounded-lg border border-border bg-card p-5 lg:col-span-2"
        >
          <h2
            id="order-heading"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Order summary
          </h2>
          <ul className="mt-4 divide-y divide-border" role="list">
            {items.map((item) => (
              <li
                key={item.product.sku}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.product.sku} · qty {item.quantity}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-base">
            <span className="font-semibold">Subtotal</span>
            <span className="font-bold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
        </section>

        <aside
          className="rounded-lg border border-border bg-card p-5"
          aria-label="Payment"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Payment
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            This demo storefront does not collect real payment information.
            Click the button below to simulate a successful order.
          </p>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={status === 'submitting'}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>Place order ({formatPrice(subtotal)})</>
            )}
          </button>
          <Link
            href="/cart"
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}