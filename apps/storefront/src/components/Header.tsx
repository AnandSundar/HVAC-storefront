'use client';

import Link from 'next/link';
import { ExternalLink, ShoppingCart, Wrench } from 'lucide-react';
import { useCartStore } from '@/lib/cart';

const ADMIN_SIGN_IN_PATH = '/admin/sign-in';
const DEV_DEFAULT_ADMIN_URL = 'http://localhost:3000';

/**
 * Resolves the admin sign-in URL at call time. `NEXT_PUBLIC_*` vars are
 * inlined at build time by Next.js (Vercel project settings), so
 * call-time vs. module-eval-time placement has zero runtime effect —
 * the placement matches `getApiUrl` in `apps/hub/src/lib/parts.ts` for
 * codebase consistency. Dev defaults to the local hub URL; in
 * production builds a `localhost` or non-HTTPS value throws so a
 * misconfigured deploy fails loud rather than shipping a broken link.
 */
function getAdminUrl(): string {
  const url = process.env.NEXT_PUBLIC_ADMIN_URL ?? DEV_DEFAULT_ADMIN_URL;
  if (
    process.env.NODE_ENV === 'production' &&
    (url.startsWith('http://localhost') || !url.startsWith('https://'))
  ) {
    throw new Error(
      `NEXT_PUBLIC_ADMIN_URL must be set to an https:// URL in production (got ${url}). ` +
        'Set the env var in the Vercel project settings.',
    );
  }
  return url;
}

/**
 * Site header — title + nav + cart badge. Reads the cart count from the
 * Zustand store so the badge updates instantly on add/remove. The Admin
 * link opens the hub's sign-in page in a new tab; resolveAdminUrl()
 * fail-loud checks the URL at render time so misconfigured prod deploys
 * surface the error immediately.
 */
export function Header(): React.ReactElement {
  const count = useCartStore((state) => state.getCount());
  const adminUrl = getAdminUrl();

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
            <a
              href={`${adminUrl}${ADMIN_SIGN_IN_PATH}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Admin sign-in (opens in a new tab)"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </a>
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
