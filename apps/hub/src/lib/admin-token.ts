import 'server-only';
import { cookies } from 'next/headers';

/**
 * Cookie name for the admin auth token. The token is set when a user signs in
 * via /admin/sign-in and cleared on sign-out. httpOnly + sameSite=lax keeps
 * the value out of JS, which is the right baseline even for a demo.
 */
export const ADMIN_TOKEN_COOKIE = 'hvac_admin_token';

/** Cookie is scoped to /admin/* so it never travels with storefront requests. */
const COOKIE_PATH = '/admin';

/**
 * Reads the admin token from the request cookies. Returns null when:
 *   - the user hasn't signed in
 *   - the cookie was cleared
 *   - the request is being rendered server-side without cookie context
 *
 * Server components, server actions, and route handlers all funnel through
 * this single helper so the policy lives in one place.
 */
export async function getAdminToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Returns true when the current request carries an admin token cookie.
 * Pure convenience wrapper over getAdminToken().
 */
export async function hasAdminToken(): Promise<boolean> {
  return (await getAdminToken()) !== null;
}

/**
 * Sets the admin token cookie. Internal helper — invoked by `signInAction`
 * in `admin-token-actions.ts`, not by client code. The cookie is:
 *   - httpOnly + sameSite=lax (JS never reads it; XSS can't exfiltrate)
 *   - secure in production (refused by browsers over http://localhost in dev)
 *   - scoped to `path: '/admin'` so it never travels with storefront requests
 *
 * No `maxAge` and no `expires` are set, which produces a true session cookie
 * that clears when the browser session ends (matches AE3).
 */
export async function setAdminToken(value: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: ADMIN_TOKEN_COOKIE,
    value,
    path: COOKIE_PATH,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Clears the admin token cookie. Internal helper — invoked by `signOutAction`
 * in `admin-token-actions.ts`. The matching `path` is required for the
 * browser to identify the cookie to delete.
 */
export async function clearAdminToken(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: ADMIN_TOKEN_COOKIE,
    value: '',
    path: COOKIE_PATH,
    maxAge: 0,
  });
}
