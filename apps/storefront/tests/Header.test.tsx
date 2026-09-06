import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// Stub the cart store so Header renders with an empty cart regardless of
// any localStorage residue. The Header test scope is the Admin link, not
// cart behavior (which has its own dedicated suite).
vi.mock('@/lib/cart', () => ({
  useCartStore: (selector: (state: unknown) => unknown) =>
    selector({
      items: [],
      getCount: () => 0,
      getSubtotal: () => 0,
    }),
}));

import { Header } from '../src/components/Header';

describe('Header — Admin sign-in link', () => {
  const originalAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ADMIN_URL;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    if (originalAdminUrl === undefined) {
      delete process.env.NEXT_PUBLIC_ADMIN_URL;
    } else {
      process.env.NEXT_PUBLIC_ADMIN_URL = originalAdminUrl;
    }
    process.env.NODE_ENV = originalNodeEnv;
    cleanup();
  });

  it('renders an Admin link in the header nav (happy path)', () => {
    render(<Header />);
    expect(
      screen.getByRole('link', { name: /admin sign-in/i }),
    ).toBeInTheDocument();
  });

  it('defaults the Admin link href to localhost:3000 when NEXT_PUBLIC_ADMIN_URL is unset', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    expect(link).toHaveAttribute('href', 'http://localhost:3000/admin/sign-in');
  });

  it('uses NEXT_PUBLIC_ADMIN_URL when set to a custom value (env-var override)', () => {
    process.env.NEXT_PUBLIC_ADMIN_URL =
      'https://hvac-fullstack-portfolio-hub.vercel.app';
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    expect(link).toHaveAttribute(
      'href',
      'https://hvac-fullstack-portfolio-hub.vercel.app/admin/sign-in',
    );
  });

  it('opens the Admin link in a new tab via target="_blank"', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('uses rel="noopener noreferrer" on the Admin link for tab-isolation security', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('carries an aria-label on the Admin link for screen readers', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    expect(link).toHaveAttribute(
      'aria-label',
      'Admin sign-in (opens in a new tab)',
    );
  });

  it('renders the ExternalLink icon alongside the Admin label (visual affordance)', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /admin sign-in/i });
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // lucide-react adds `lucide-<icon-name>` as a stable class.
    expect(svg?.getAttribute('class') ?? '').toMatch(/lucide-external-link/);
  });

  it('still renders the Cart link to /cart (regression — Admin link insertion did not break Cart)', () => {
    render(<Header />);
    const cartLink = screen.getByRole('link', { name: /cart, 0 items/i });
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute('href', '/cart');
  });
});
