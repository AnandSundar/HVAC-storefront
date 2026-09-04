import Link from 'next/link';
import { PackagePlus } from 'lucide-react';

/**
 * Shown when the parts list comes back empty. The "New part" link routes
 * to the create form (U4).
 */
export function EmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-background px-6 py-16 text-center">
      <PackagePlus className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-base font-medium text-foreground">
          No parts yet — add the first one.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Parts show up here as soon as you create them.
        </p>
      </div>
      <Link
        href="/admin/inventory/new"
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        New part
      </Link>
    </div>
  );
}
