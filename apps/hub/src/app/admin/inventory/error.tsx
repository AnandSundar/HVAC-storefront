'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface AdminInventoryErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Error boundary for the inventory list. Reached when `listParts` throws
 * (network error, timeout, 4xx/5xx). `reset()` retries the server render.
 */
export default function AdminInventoryError({
  error,
  reset,
}: AdminInventoryErrorProps): React.ReactElement {
  useEffect(() => {
    // Surface the error to the console with the server digest so it can be
    // matched against Next.js server logs. The message is intentionally NOT
    // echoed to the user — Laravel debug-mode stack traces and SQL fragments
    // must not reach the browser.
    console.error('Admin inventory list error:', error);
  }, [error]);

  const isTimeout = error.digest?.startsWith('NEXT_HTTP_ERROR_FALLBACK;504') ?? false;
  const headline = isTimeout
    ? 'The PHP API timed out — try again.'
    : 'Could not load parts — try again.';
  const detail = isTimeout
    ? 'The request did not complete in under 5 seconds.'
    : 'Either the API is unreachable or it returned an unexpected response.';

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="container mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-foreground">{headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <RotateCw className="h-4 w-4" />
        Retry
      </button>
    </section>
  );
}
