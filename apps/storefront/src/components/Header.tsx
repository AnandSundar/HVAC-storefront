'use client';

import Link from 'next/link';
import { ShoppingCart, Wrench } from 'lucide-react';
import { useCartStore } from '@/lib/cart';

/**
 * Site header — title + nav + cart badge. Reads the cart count from the
 * Zustand store so the badge updates instantly on add/remove.
 */
export function Header(): React.ReactElement {
  const count = useCartStore((state) => state.getCount());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Primary"
        className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4"
      >
        <Link
          href="/products"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
            aria-hidden="true"
          >
            <Wrench className="h-4 w-4" />
          </span>
          <span>HVAC Parts Storefront</span>
        </Link>

        <ul className="flex items-center gap-1">
          <li>
            <Link
              href="/products"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              href="/cart"
              className="relative inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 ? (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground"
                >
                  {count}
                </span>
              ) : null}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}