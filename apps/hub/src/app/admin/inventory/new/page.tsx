import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminToken } from '@/lib/admin-token';
import { redirect } from 'next/navigation';
import { PartForm } from '@/components/admin/PartForm';

/**
 * New-part creation page. The actual gating happens here (not in the layout,
 * per KTD-3) so the sign-in page itself cannot enter a redirect loop.
 */
export default async function NewPartPage(): Promise<React.ReactElement> {
  const token = await getAdminToken();
  if (token === null) {
    redirect('/admin/sign-in?reason=expired');
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
          New part
        </h1>
        <p className="text-sm text-muted-foreground">
          Add an HVAC part to the inventory. All fields except{" "}
          <span className="font-mono">bin_location</span> are required.
        </p>
      </header>

      <PartForm mode="create" token={token} />
    </section>
  );
}
