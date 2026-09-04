import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

/**
 * Shown when the edit page's `notFound()` fires (PHP API returned 404 for
 * the requested SKU). Centralized here so the wording is editable in one
 * place; the page itself just calls `notFound()`.
 */
export default function EditPartNotFound(): React.ReactElement {
  return (
    <section className="container mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-foreground">
          That part does not exist.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted, or the link you followed is stale.
        </p>
      </div>
      <Link
        href="/admin/inventory"
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inventory
      </Link>
    </section>
  );
}
