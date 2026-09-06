import { ArrowDown, Sparkles } from 'lucide-react';
import { profile } from '@/data/profile';

export function Hero(): React.ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="animate-fade-in"
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Built for the Sept 8, 2026 Robert Half virtual interview</span>
      </div>

      <h1
        id="hero-heading"
        className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
      >
        {profile.name}
      </h1>

      <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
        {profile.headline}
      </p>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/90 sm:text-lg">
        {profile.pitch}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Next.js, end-to-end.</span>
        <span aria-hidden="true">·</span>
        <span>TypeScript strict, server components, persistent cart</span>
      </div>

      <a
        href="#projects-heading"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        See the storefront
        <ArrowDown className="h-4 w-4" />
      </a>
    </section>
  );
}
