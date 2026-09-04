import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { TechBadge } from '@/components/TechBadge';
import { cn } from '@/lib/cn';
import type { Project } from '@/data/projects';

interface ProjectCardProps {
  readonly project: Project;
  readonly className?: string;
}

const STATUS_LABEL: Record<Project['status'], string> = {
  live: 'Live',
  deployable: 'One-click deploy',
  demo: 'Demo',
};

const STATUS_STYLE: Record<Project['status'], string> = {
  live: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  deployable: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  demo: 'bg-secondary text-secondary-foreground border-border',
};

export function ProjectCard({
  project,
  className,
}: ProjectCardProps): React.ReactElement {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/20 hover:shadow-md',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
            STATUS_STYLE[project.status],
          )}
        >
          {STATUS_LABEL[project.status]}
        </span>
        <span className="text-xs text-muted-foreground">{project.year}</span>
      </div>

      <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
        <Link
          href={`/projects/${project.slug}`}
          className="outline-none transition-colors hover:text-primary focus-visible:text-primary"
        >
          {project.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">{project.tagline}</p>

      <ul
        role="list"
        aria-label={`Tech stack for ${project.title}`}
        className="mt-5 flex flex-wrap gap-1.5"
      >
        {project.tech.map((techName) => (
          <li key={techName}>
            <TechBadge label={techName} />
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          aria-label={`View ${project.title} details`}
        >
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {project.primaryLink.external ? (
          <a
            href={project.primaryLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Open ${project.title} live`}
          >
            Open
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
