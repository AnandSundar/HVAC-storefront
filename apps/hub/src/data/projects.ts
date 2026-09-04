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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://hvac-fullstack-portfolio-api.onrender.com';

const PHP_REPO_URL =
  process.env.NEXT_PUBLIC_PHP_REPO_URL ??
  'https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/php-api';

const GITHUB_ROOT = 'https://github.com/morninganand/hvac-fullstack-portfolio';

export const projects: readonly Project[] = [
  {
    slug: 'storefront',
    title: 'HVAC Parts Storefront',
    tagline: 'Customer-facing eCommerce demo backed by GraphQL.',
    description:
      'Browse 25+ HVAC parts across 5 categories, view product detail, add to cart, and walk through a mock checkout.',
    longDescription:
      'A Next.js 15 customer-facing storefront built to demonstrate a realistic eCommerce flow. RSC fetches product listings and detail pages server-side from the live Node GraphQL API, with a TanStack Query client cache for client-side interactions. Cart state lives in a Zustand store with localStorage persistence so it survives reloads. Tailwind styles match the hub for a consistent recruiter experience.',
    tech: ['Next.js 15', 'React 19', 'TypeScript', 'TanStack Query', 'Zustand', 'Tailwind CSS'],
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
      'Server-side GraphQL fetch via graphql-request with TanStack Query caching',
      'Persistent Zustand cart survives reloads via localStorage',
      'Graceful fallback to cached static data when the API is unreachable',
    ],
  },
  {
    slug: 'node-api',
    title: 'Node.js GraphQL API',
    tagline: 'graphql-yoga + Pothos, seeded from shared fixtures.',
    description:
      'Express + graphql-yoga service exposing products, single-product lookup, and an admin-only createProduct mutation.',
    longDescription:
      'A type-safe Node.js 22 GraphQL service that powers the storefront. Schema is built with Pothos from TypeScript types in packages/shared-data, so the GraphQL surface and the client types cannot drift. In-memory store is seeded at boot from the same fixtures the hub uses. Helmet + CORS + Zod input validation; mutation gated behind a header-based mock admin check.',
    tech: ['Node.js 22', 'GraphQL', 'graphql-yoga', 'Pothos', 'Express', 'Zod', 'Helmet'],
    role: 'Solo developer – backend',
    year: '2026',
    status: 'live',
    primaryLink: {
      label: 'Open GraphQL endpoint',
      href: `${API_URL}/graphql`,
      external: true,
    },
    secondaryLink: {
      label: 'View source on GitHub',
      href: `${GITHUB_ROOT}/tree/main/apps/api`,
      external: true,
    },
    highlights: [
      'Schema-first GraphQL with Pothos code-builder + full TS type safety',
      'Seeded from packages/shared-data — single source of truth across the monorepo',
      'Admin createProduct mutation behind header check, Zod input validation',
      'Helmet security headers, CORS locked to the storefront origin in prod',
    ],
  },
  {
    slug: 'php-api',
    title: 'Laravel 11 PHP REST API',
    tagline: 'REST API with Eloquent ORM and Form Request validation.',
    description:
      'Standalone Laravel 11 service exposing /api/parts endpoints with deliberately legacy field naming for cross-stack realism.',
    longDescription:
      'A Laravel 11 REST API demonstrating real-world PHP patterns: Eloquent ORM, Form Request validation, API Resources for response shaping, and CORS configuration. Uses SQLite so the build needs no Postgres setup. Field names intentionally differ from the Node API (part_number vs sku, unit_cost vs price, inventory_qty vs stock) to demonstrate realistic cross-stack integration friction.',
    tech: ['PHP 8.3', 'Laravel 11', 'Eloquent ORM', 'SQLite', 'PHPUnit'],
    role: 'Solo developer – backend',
    year: '2026',
    status: 'deployable',
    primaryLink: {
      label: 'One-click deploy to Render',
      href: 'https://render.com/deploy?repo=https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/php-api',
      external: true,
    },
    secondaryLink: {
      label: 'View source on GitHub',
      href: PHP_REPO_URL,
      external: true,
    },
    highlights: [
      'GET /api/parts with optional category filter and pagination',
      'POST /api/parts validated via StorePartRequest Form Request',
      'Eloquent PartResource shapes every response consistently',
      'PHPUnit feature tests cover happy + error paths (validation, 404, etc.)',
    ],
  },
  {
    slug: 'about',
    title: 'This Hub',
    tagline: 'The recruiter landing page you are reading right now.',
    description:
      'Next.js 15 portfolio hub with four project cards, an about page, and per-project detail pages. The first click.',
    longDescription:
      'The hub you are looking at. Built with Next.js 15 App Router, TypeScript strict, Tailwind, and shadcn-style UI primitives (cva + clsx + tailwind-merge + lucide-react). Renders statically; the Nav uses a small client component for the mobile menu toggle. All project URLs are environment-driven so a deploy can swap in real Vercel/Render URLs after U2-U5 ship.',
    tech: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'shadcn-style UI', 'lucide-react'],
    role: 'Solo developer – full-stack',
    year: '2026',
    status: 'demo',
    primaryLink: {
      label: 'Read the about page',
      href: '/about',
      external: false,
    },
    secondaryLink: {
      label: 'View source on GitHub',
      href: `${GITHUB_ROOT}/tree/main/apps/hub`,
      external: true,
    },
    highlights: [
      '4 project cards with environment-driven deploy URLs',
      'Static rendering (RSC) – fast first paint, low JS payload',
      'Mobile-first responsive layout via Tailwind breakpoints',
      'Vitest smoke test verifies routes render and project data shape',
    ],
  },
];

export function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const projectSlugs = projects.map((p) => p.slug);
