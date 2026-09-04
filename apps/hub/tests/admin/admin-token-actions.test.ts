import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

const cookieJar = new Map<string, { value: string; path?: string }>();

const redirectMock = vi.fn((url: string) => {
  throw { digest: `NEXT_REDIRECT;replace;${url};307;` };
});

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (opts: { name: string; value: string; path?: string }) => {
      cookieJar.set(opts.name, { value: opts.value, path: opts.path });
    },
  })),
}));

// node's process.env is typed readonly; tests legitimately need to mutate it.
const env = process.env as Record<string, string | undefined>;
const ORIGINAL_NODE_ENV = env.NODE_ENV;
const ORIGINAL_HUB_TOKEN = env.HUB_ADMIN_TOKEN;

async function importActions() {
  vi.resetModules();
  return import('../../src/lib/admin-token-actions');
}

beforeEach(() => {
  cookieJar.clear();
  redirectMock.mockClear();
  env.HUB_ADMIN_TOKEN = 'test-secret';
  env.NODE_ENV = 'test';
});

afterEach(() => {
  env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_HUB_TOKEN === undefined) {
    delete env.HUB_ADMIN_TOKEN;
  } else {
    env.HUB_ADMIN_TOKEN = ORIGINAL_HUB_TOKEN;
  }
});

describe('signInAction', () => {
  it('rejects an empty token without setting the cookie', async () => {
    const { signInAction } = await importActions();
    const result = await signInAction(undefined, new FormData());
    expect(result).toEqual({ ok: false, error: 'Token rejected' });
    expect(cookieJar.has('hvac_admin_token')).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('rejects a wrong token without echoing it back', async () => {
    const { signInAction } = await importActions();
    const formData = new FormData();
    formData.set('token', 'wrong-secret');
    const result = await signInAction(undefined, formData);
    expect(result).toEqual({ ok: false, error: 'Token rejected' });
    // The submitted token must not appear in the error message.
    expect(JSON.stringify(result)).not.toContain('wrong-secret');
    expect(cookieJar.has('hvac_admin_token')).toBe(false);
  });

  it('accepts the correct token and triggers a redirect', async () => {
    const { signInAction } = await importActions();
    const formData = new FormData();
    formData.set('token', 'test-secret');
    await expect(signInAction(undefined, formData)).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    });
    expect(cookieJar.get('hvac_admin_token')?.value).toBe('test-secret');
    expect(redirectMock).toHaveBeenCalledWith('/admin/inventory');
  });

  it('falls back to "test-secret" in dev when HUB_ADMIN_TOKEN is unset', async () => {
    env.NODE_ENV = 'development';
    delete env.HUB_ADMIN_TOKEN;
    const { signInAction } = await importActions();
    const formData = new FormData();
    formData.set('token', 'test-secret');
    await expect(signInAction(undefined, formData)).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    });
    expect(cookieJar.get('hvac_admin_token')?.value).toBe('test-secret');
  });
});

describe('signOutAction', () => {
  it('clears the cookie and redirects to the sign-in page', async () => {
    cookieJar.set('hvac_admin_token', { value: 'some-token', path: '/admin' });
    const { signOutAction } = await importActions();
    await expect(signOutAction()).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    });
    expect(cookieJar.get('hvac_admin_token')?.value).toBe('');
    expect(redirectMock).toHaveBeenCalledWith('/admin/sign-in?reason=signed_out');
  });
});

describe('production fail-closed posture', () => {
  it('throws at import time when NODE_ENV=production and HUB_ADMIN_TOKEN is unset', async () => {
    env.NODE_ENV = 'production';
    delete env.HUB_ADMIN_TOKEN;
    vi.resetModules();
    await expect(import('../../src/lib/admin-token-actions')).rejects.toThrow(
      /HUB_ADMIN_TOKEN must be set in production/,
    );
  });

  it('does NOT throw at import when HUB_ADMIN_TOKEN is set in production', async () => {
    env.NODE_ENV = 'production';
    env.HUB_ADMIN_TOKEN = 'a-strong-secret';
    vi.resetModules();
    await expect(import('../../src/lib/admin-token-actions')).resolves.toBeDefined();
  });
});
