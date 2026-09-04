import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAdminToken } from '@/lib/admin-token';

/**
 * Inventory landing page. U2 establishes the auth gate (the only reason this
 * page exists at this point — U3 expands the body to render the parts list
 * with `<PartsTable>` and the success banners for `?created=` / `?updated=`).
 *
 * The gate is per-page rather than in `admin/layout.tsx` to avoid the
 * documented layout-vs-sign-in redirect loop. See the admin UI plan, KTD-3.
 */
export default async function AdminInventoryPage(): Promise<React.ReactElement> {
  const token = await getAdminToken();
  if (token === null) {
    redirect('/admin/sign-in?reason=expired');
  }

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

      <div className="rounded-md border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        Parts list placeholder. The table and the create / edit forms ship in
        U3 and U4.
      </div>
    </section>
  );
}
