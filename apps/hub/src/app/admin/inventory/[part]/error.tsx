'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react';

interface AdminPartEditErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Error boundary for the edit page. The fetcher may throw on 503, timeout,
 * or a generic PHP crash; the dynamic-page `notFound()` is the right path
 * for 404 specifically (handled separately in U4 via not-found.tsx).
 */
export default function AdminPartEditError({
  error,
  reset,
}: AdminPartEditErrorProps): React.ReactElement {
  useEffect(() => {
    console.error('Admin edit page error:', error);
  }, [error]);

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="container mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-foreground">
          Could not load this part — try again.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Either the API is unreachable or it returned an unexpected response.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <RotateCw className="h-4 w-4" />
          Retry
        </button>
        <Link
          href="/admin/inventory"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>
      </div>
    </section>
  );
}
