'use server';

import { redirect } from 'next/navigation';
import { setAdminToken, clearAdminToken } from './admin-token';

/**
 * Server actions for admin sign-in / sign-out.
 *
 * File-top `'use server'` marks every export as a server action (RPC).
 * `signInAction` and `signOutAction` are invoked from the client form via
 * `useActionState` / form `action`. Cookie writes happen through the internal
 * helpers in `admin-token.ts` — they're plain functions (not RPCs) so the
 * server action doesn't pay RPC overhead for a same-process cookie write.
 *
 * Security notes:
 *   - `setAdminToken` / `clearAdminToken` scope the cookie to `path: '/admin'`
 *     so it never travels with storefront requests.
 *   - The submitted token is NEVER echoed back in error messages or logs.
 *   - In production, the module throws at load if `HUB_ADMIN_TOKEN` is unset —
 *     this mirrors the PHP API's fail-closed posture so a misconfigured
 *     production hub cannot accidentally accept the literal dev fallback.
 *   - Server actions rely on Next.js 15's built-in origin check for CSRF
 *     protection; do not configure `serverActions.allowedOrigins` to widen
 *     the allowlist without a security review.
 */

// Fail-closed posture in production: refuse to load this module at all if
// HUB_ADMIN_TOKEN is unset. This prevents a misconfigured production hub
// from silently accepting the literal "test-secret" dev fallback.
if (process.env.NODE_ENV === 'production' && !process.env.HUB_ADMIN_TOKEN) {
  throw new Error(
    'HUB_ADMIN_TOKEN must be set in production. The hub fails closed (no ' +
      'fallback to a default token) to match the PHP API render.yaml posture.',
  );
}

/** State shape returned by signInAction for `useActionState`. */
export type SignInState =
  | { ok: true }
  | { ok: false; error: string };

const REJECTED: SignInState = { ok: false, error: 'Token rejected' };

/**
 * Sign-in server action. Compares the submitted token against
 * `HUB_ADMIN_TOKEN ?? 'test-secret'`. On match, writes the cookie and
 * redirects to the inventory list. On mismatch, returns a state the form
 * renders without echoing the submitted value.
 */
export async function signInAction(_prev: SignInState | undefined, formData: FormData): Promise<SignInState> {
  const submitted = ((formData.get('token') as string | null) ?? '').trim();
  if (submitted === '') {
    return REJECTED;
  }
  const expected = process.env.HUB_ADMIN_TOKEN ?? 'test-secret';
  // Timing-safe compare so the demo can't be trivially brute-forced by
  // measuring response latency. Falls back to a plain compare if the
  // runtime doesn't expose `timingSafeEqual`.
  const match =
    submitted.length === expected.length &&
    (await safeEqual(submitted, expected));
  if (!match) {
    return REJECTED;
  }
  await setAdminToken(submitted);
  redirect('/admin/inventory');
}

async function safeEqual(a: string, b: string): Promise<boolean> {
  const { timingSafeEqual } = await import('node:crypto');
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Sign-out server action. Clears the cookie and redirects to the sign-in
 * page with `?reason=signed_out` so the form can show a confirmation banner.
 */
export async function signOutAction(): Promise<void> {
  await clearAdminToken();
  redirect('/admin/sign-in?reason=signed_out');
}
