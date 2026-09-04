'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type SignInState } from '@/lib/admin-token-actions';

const INITIAL_STATE: SignInState = { ok: false, error: '' };

/**
 * Pending-state submit button. Lives in its own component so `useFormStatus`
 * can read the parent <form>'s pending flag — the hook only works inside a
 * form-rendered child, not in the same component that renders the form.
 */
function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

/**
 * Single-token sign-in form. The submitted value never leaves the network
 * boundary — `signInAction` returns a generic error string on mismatch, never
 * the submitted token itself.
 */
export function SignInForm(): React.ReactElement {
  const [state, formAction] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-token"
          className="text-sm font-medium text-foreground"
        >
          Admin token
        </label>
        <input
          id="admin-token"
          name="token"
          type="password"
          required
          autoComplete="off"
          spellCheck={false}
          aria-describedby={state.ok ? undefined : 'admin-token-error'}
          aria-invalid={state.ok ? undefined : true}
          className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {state.ok || state.error === '' ? null : (
        <p
          id="admin-token-error"
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
