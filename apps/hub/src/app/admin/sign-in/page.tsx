import { SignInForm } from '@/components/admin/SignInForm';

interface SignInPageProps {
  readonly searchParams: Promise<{ readonly reason?: string }>;
}

/**
 * User-facing copy for the `?reason=` query-string banner. Centralized here
 * so the wording is editable in one place and the form keeps its single
 * responsibility (collect + submit the token).
 */
const BANNERS: Record<string, { title: string; body: string }> = {
  expired: {
    title: 'Your session ended — please sign in again.',
    body: 'The admin token cookie was missing or expired.',
  },
  signed_out: {
    title: "You've been signed out.",
    body: 'Come back any time.',
  },
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps): Promise<React.ReactElement> {
  const { reason } = await searchParams;
  const banner = reason ? BANNERS[reason] : undefined;
  return (
    <div className="container mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin sign-in</h1>
        <p className="text-sm text-muted-foreground">
          Enter the demo token to manage HVAC parts inventory.
        </p>
      </header>

      {banner ? (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <p className="font-medium">{banner.title}</p>
          <p className="mt-1 text-xs opacity-90">{banner.body}</p>
        </div>
      ) : null}

      <SignInForm />
    </div>
  );
}
