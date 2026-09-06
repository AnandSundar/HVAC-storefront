export interface ProjectLink {
  readonly label: string;
  readonly href: string;
  readonly external: boolean;
}

export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly longDescription: string;
  readonly tech: readonly string[];
  readonly role: string;
  readonly year: string;
  readonly status: 'live' | 'deployable' | 'demo';
  readonly primaryLink: ProjectLink;
  readonly secondaryLink?: ProjectLink;
  readonly highlights: readonly string[];
}

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ??
  'https://hvac-fullstack-portfolio-storefront.vercel.app';

const GITHUB_ROOT = 'https://github.com/AnandSundar/hvac-fullstack-portfolio';

export const projects: readonly Project[] = [
  {
    slug: 'storefront',
    title: 'HVAC Parts Storefront',
    tagline: 'Customer-facing eCommerce demo backed by a static fallback.',
    description:
      'Browse 25+ HVAC parts across 5 categories, view product detail, add to cart, and walk through a mock checkout.',
    longDescription:
      'A Next.js 15 customer-facing storefront built to demonstrate a realistic eCommerce flow. Product listings and detail pages render from the bundled fallback dataset (packages/shared-data) so the demo works without any live API. Cart state lives in a Zustand store with localStorage persistence so it survives reloads. Tailwind styles match the hub for a consistent recruiter experience.',
    tech: ['Next.js 15', 'React 19', 'TypeScript', 'Zustand', 'Tailwind CSS'],
    role: 'Solo developer – full-stack',
    year: '2026',
    status: 'live',
    primaryLink: {
      label: 'Open storefront',
      href: STOREFRONT_URL,
      external: true,
    },
    secondaryLink: {
      label: 'View source on GitHub',
      href: `${GITHUB_ROOT}/tree/main/apps/storefront`,
      external: true,
    },
    highlights: [
      '25+ HVAC parts across Furnaces, Filters, Thermostats, Motors, and Controls',
      'Server-rendered product listings from the shared fixtures package',
      'Persistent Zustand cart survives reloads via localStorage',
      'Admin sign-in link in the header opens the hub in a new tab',
    ],
  },
];

export function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const projectSlugs = projects.map((p) => p.slug);
