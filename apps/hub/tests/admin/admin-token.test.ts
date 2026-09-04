import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const cookieJar = new Map<string, { value: string; path?: string }>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (opts: { name: string; value: string; path?: string }) => {
      cookieJar.set(opts.name, { value: opts.value, path: opts.path });
    },
  })),
}));

const { getAdminToken, hasAdminToken, setAdminToken, clearAdminToken, ADMIN_TOKEN_COOKIE } =
  await import('../../src/lib/admin-token');

beforeEach(() => {
  cookieJar.clear();
});

describe('ADMIN_TOKEN_COOKIE', () => {
  it('is the documented cookie name', () => {
    expect(ADMIN_TOKEN_COOKIE).toBe('hvac_admin_token');
  });
});

describe('getAdminToken', () => {
  it('returns null when no cookie is set', async () => {
    expect(await getAdminToken()).toBeNull();
  });

  it('returns the cookie value when present', async () => {
    cookieJar.set(ADMIN_TOKEN_COOKIE, { value: 'test-secret' });
    expect(await getAdminToken()).toBe('test-secret');
  });
});

describe('hasAdminToken', () => {
  it('returns false when no cookie is set', async () => {
    expect(await hasAdminToken()).toBe(false);
  });

  it('returns true when the cookie is present', async () => {
    cookieJar.set(ADMIN_TOKEN_COOKIE, { value: 'test-secret' });
    expect(await hasAdminToken()).toBe(true);
  });
});

describe('setAdminToken', () => {
  it('writes the cookie scoped to /admin', async () => {
    await setAdminToken('the-token');
    const entry = cookieJar.get(ADMIN_TOKEN_COOKIE);
    expect(entry?.value).toBe('the-token');
    expect(entry?.path).toBe('/admin');
  });
});

describe('clearAdminToken', () => {
  it('expires the cookie', async () => {
    await setAdminToken('the-token');
    expect(cookieJar.get(ADMIN_TOKEN_COOKIE)?.value).toBe('the-token');
    await clearAdminToken();
    const entry = cookieJar.get(ADMIN_TOKEN_COOKIE);
    expect(entry?.value).toBe('');
  });
});
