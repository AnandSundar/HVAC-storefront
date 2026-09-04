import { Hero } from '@/components/Hero';
import { ProjectCard } from '@/components/ProjectCard';
import { projects } from '@/data/projects';

export default function HomePage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <Hero />

      <section aria-labelledby="projects-heading" className="mt-16 sm:mt-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2
              id="projects-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Projects
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Four deployable surfaces demonstrating the JD technology stack.
            </p>
          </div>
        </div>

        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2"
        >
          {projects.map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
