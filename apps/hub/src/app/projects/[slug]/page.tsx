import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { TechBadge } from '@/components/TechBadge';
import { projects, findProject, projectSlugs } from '@/data/projects';

interface ProjectPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export function generateStaticParams(): Array<{ readonly slug: string }> {
  return projectSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) {
    return { title: 'Project not found' };
  }
  return {
    title: project.title,
    description: project.tagline,
  };
}

export default async function ProjectPage({
  params,
}: ProjectPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all projects
      </Link>

      <header className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span
            className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-secondary-foreground"
            aria-label={`Status: ${project.status}`}
          >
            {project.status}
          </span>
          <span className="text-sm text-muted-foreground">{project.year}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {project.tagline}
        </p>
      </header>

      <section aria-labelledby="overview-heading" className="mb-10">
        <h2
          id="overview-heading"
          className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Overview
        </h2>
        <p className="text-base leading-relaxed text-foreground/90">
          {project.longDescription}
        </p>
      </section>

      <section aria-labelledby="highlights-heading" className="mb-10">
        <h2
          id="highlights-heading"
          className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Highlights
        </h2>
        <ul role="list" className="space-y-2">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-3 text-sm sm:text-base">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="leading-relaxed">{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack-heading" className="mb-10">
        <h2
          id="stack-heading"
          className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Tech Stack
        </h2>
        <ul role="list" className="flex flex-wrap gap-2">
          {project.tech.map((techName) => (
            <li key={techName}>
              <TechBadge label={techName} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="role-heading"
        className="mb-10 grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-2"
      >
        <div>
          <h3
            id="role-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Role
          </h3>
          <p className="mt-1 text-sm font-medium">{project.role}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Year
          </h3>
          <p className="mt-1 text-sm font-medium">{project.year}</p>
        </div>
      </section>

      <section aria-labelledby="links-heading" className="mb-12">
        <h2
          id="links-heading"
          className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Links
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {project.primaryLink.external ? (
            <a
              href={project.primaryLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {project.primaryLink.label}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <Link
              href={project.primaryLink.href}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {project.primaryLink.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {project.secondaryLink ? (
            <a
              href={project.secondaryLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {project.secondaryLink.label}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </section>

      <nav
        aria-label="Project navigation"
        className="flex items-center justify-between border-t border-border pt-6 text-sm"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          About
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      {/* Tell TypeScript the projects array is consumed for navigation hints. */}
      <span className="sr-only">
        {projects.length} projects available.
      </span>
    </article>
  );
}
