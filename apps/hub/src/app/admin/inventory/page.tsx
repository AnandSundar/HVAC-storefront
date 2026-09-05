import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getAdminToken } from '@/lib/admin-token';
import { listParts } from '@/lib/parts';
import { PartsTable } from '@/components/admin/PartsTable';
import { EmptyState } from '@/components/admin/EmptyState';

interface AdminInventoryPageProps {
  readonly searchParams: Promise<{
    readonly created?: string;
    readonly updated?: string;
    readonly deleted?: string;
  }>;
}

/**
 * Auth-gated parts list page. Reads `?created=<sku>` / `?updated=<sku>` /
 * `?deleted=<sku>` (set by `submitPartAction` after create/edit and by
 * `deletePartAction` after a successful delete) and renders a success banner
 * above the table.
 *
 * Throws from `listParts` propagate to the route's `error.tsx` boundary; the
 * empty-result case renders the `<EmptyState>` instead.
 */
export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps): Promise<React.ReactElement> {
  const token = await getAdminToken();
  if (token === null) {
    redirect('/admin/sign-in?reason=expired');
  }

  const parts = await listParts(token);
  const { created, updated, deleted } = await searchParams;

  return (
    <section className="container mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage HVAC parts: list, create, and edit.
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New part
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {created !== undefined ? (
        <SuccessBanner sku={created} kind="created" />
      ) : null}
      {updated !== undefined ? (
        <SuccessBanner sku={updated} kind="updated" />
      ) : null}
      {deleted !== undefined ? (
        <SuccessBanner sku={deleted} kind="deleted" />
      ) : null}

      {parts.length === 0 ? <EmptyState /> : <PartsTable parts={parts} />}
    </section>
  );
}

interface SuccessBannerProps {
  readonly sku: string;
  readonly kind: 'created' | 'updated' | 'deleted';
}

function SuccessBanner({ sku, kind }: SuccessBannerProps): React.ReactElement {
  // R12 — exhaustive Record-keyed map. Extending the `kind` union without
  // updating this object is a compile-time error (rather than the previous
  // ternary, which would silently fall through to `'updated'`).
  const verbs: Record<SuccessBannerProps['kind'], string> = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
  };
  const verb = verbs[kind];
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <p>
        Part <span className="font-mono font-medium">{sku}</span> {verb}.
      </p>
    </div>
  );
}
