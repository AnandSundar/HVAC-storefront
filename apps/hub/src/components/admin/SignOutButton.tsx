'use client';

import { useFormStatus } from 'react-dom';
import { signOutAction } from '@/lib/admin-token-actions';

/**
 * Standalone sign-out button so `useFormStatus` can read the parent form's
 * pending flag. The form action clears the cookie and redirects to
 * `/admin/sign-in?reason=signed_out`; this component only renders the submit.
 */
function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

/**
 * Signs the user out by invoking `signOutAction` via a form submission. The
 * redirect after a successful sign-out lands the user on the sign-in page
 * with a confirmation banner.
 */
export function SignOutButton(): React.ReactElement {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
