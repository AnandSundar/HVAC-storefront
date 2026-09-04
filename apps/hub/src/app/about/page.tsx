import type { Metadata } from 'next';
import { Mail, MapPin, FileText, Github, Linkedin } from 'lucide-react';
import { TechBadge } from '@/components/TechBadge';
import { profile, skillsByCategory, type SkillCategory } from '@/data/profile';

export const metadata: Metadata = {
  title: 'About',
  description: `Bio, tech stack matrix, and links for ${profile.name}.`,
};

const SKILL_CATEGORY_ORDER: readonly SkillCategory[] = [
  'Frontend',
  'Backend',
  'Database',
  'Tooling',
  'Cloud & DevOps',
];

export default function AboutPage(): React.ReactElement {
  const grouped = skillsByCategory();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="mb-10 sm:mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About {profile.name}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {profile.headline}
        </p>
      </header>

      <section aria-labelledby="bio-heading" className="mb-12">
        <h2 id="bio-heading" className="sr-only">
          Bio
        </h2>
        <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
          {profile.bio}
        </p>
      </section>

      <section aria-labelledby="contact-heading" className="mb-12">
        <h2
          id="contact-heading"
          className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Contact & Links
        </h2>
        <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{profile.email}</span>
            </a>
          </li>
          <li>
            <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{profile.location}</span>
            </div>
          </li>
          <li>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">GitHub profile</span>
            </a>
          </li>
          <li>
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">LinkedIn profile</span>
            </a>
          </li>
          <li className="sm:col-span-2">
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">Resume (PDF)</span>
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="stack-heading" className="mb-12">
        <h2
          id="stack-heading"
          className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Tech Stack Matrix
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Grouped by category. Proficiency is honest:{' '}
          <span className="font-medium">expert</span> means I have shipped it to
          production; <span className="font-medium">proficient</span> means I am
          comfortable using it under time pressure;{' '}
          <span className="font-medium">familiar</span> means I have used it but
          would lean on documentation.
        </p>

        <div className="space-y-8">
          {SKILL_CATEGORY_ORDER.map((category) => {
            const skills = grouped.get(category);
            if (!skills || skills.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h3>
                <ul role="list" className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <li key={skill.name}>
                      <TechBadge
                        label={skill.name}
                        proficiency={skill.proficiency}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
