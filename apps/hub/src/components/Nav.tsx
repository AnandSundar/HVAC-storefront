'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github } from 'lucide-react';
import { cn } from '@/lib/cn';
import { profile } from '@/data/profile';

interface NavItem {
  readonly href: string;
  readonly label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Projects' },
  { href: '/about', label: 'About' },
];

export function Nav(): React.ReactElement {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Primary"
        className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
          onClick={() => setMobileOpen(false)}
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
            aria-hidden="true"
          >
            AM
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-border/60 bg-background sm:hidden"
        >
          <ul className="container mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
