import Link from 'next/link';
import { Github, Mail } from 'lucide-react';
import { profile } from '@/data/profile';

export function Footer(): React.ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="container mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <p className="text-sm font-medium">{profile.name}</p>
          <p className="text-xs text-muted-foreground">
            {year} – Portfolio for the Robert Half virtual interview.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex items-center gap-4 text-sm">
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Email ${profile.name}`}
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </li>
            <li>
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
