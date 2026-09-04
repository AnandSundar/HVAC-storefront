import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminToken } from '@/lib/admin-token';
import { getPart } from '@/lib/parts';
import { PartForm } from '@/components/admin/PartForm';

interface EditPartPageProps {
  readonly params: Promise<{ readonly part: string }>;
}

/**
 * Edit-existing-part page. `notFound()` is reached when the PHP API returns
 * 404 (unknown SKU); any other non-2xx propagates to error.tsx.
 *
 * The auth gate is per-page rather than in admin/layout.tsx, matching the
 * sign-in / inventory pages — see KTD-3 in the plan.
 */
export default async function EditPartPage({
  params,
}: EditPartPageProps): Promise<React.ReactElement> {
  const { part } = await params;
  const token = await getAdminToken();
  if (token === null) {
    redirect('/admin/sign-in?reason=expired');
  }

  let partData;
  try {
    partData = await getPart(token, part);
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      notFound();
    }
    throw err;
  }

  return (
    <section className="container mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Link
        href="/admin/inventory"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inventory
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Edit part
        </h1>
        <p className="text-sm text-muted-foreground">
          Editing <span className="font-mono font-medium">{partData.part_number}</span>.
          Leave a field blank to keep its current value.
        </p>
      </header>

      <PartForm
        mode="edit"
        token={token}
        partNumber={partData.part_number}
        initialValues={{
          name: partData.name,
          description: partData.description,
          unit_cost: partData.unit_cost,
          inventory_qty: partData.inventory_qty,
          bin_location: partData.bin_location,
          category: partData.category,
          manufacturer: partData.manufacturer,
        }}
      />
    </section>
  );
}
