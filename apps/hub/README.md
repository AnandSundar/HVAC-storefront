# Hub – Next.js Portfolio Landing Page

> Recruiter-facing landing page for the HVAC full-stack portfolio monorepo.
> Built with Next.js 15 App Router, TypeScript strict, and shadcn-style UI primitives.

This is the first thing a recruiter clicks. It links to every other deployable surface in the monorepo (storefront, Node GraphQL API, PHP REST API).

---

## Stack

- **Next.js 15** (App Router, RSC)
- **React 19**
- **TypeScript strict** (`@/*` path alias → `src/*`)
- **Tailwind CSS 3** + shadcn-style tokens
- **shadcn-style UI primitives** – `class-variance-authority` + `clsx` + `tailwind-merge` + `lucide-react`
- **Vitest** – smoke tests
- **pnpm** workspace package (consumes `@hvac-portfolio/shared-data`)

---

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm --filter hub dev
```

The hub boots on http://localhost:3000.

For environment-driven deploy URLs:

```bash
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.example.com \
NEXT_PUBLIC_API_URL=https://your-api.example.com \
NEXT_PUBLIC_PHP_REPO_URL=https://github.com/you/repo/tree/main/apps/php-api \
  pnpm --filter hub dev
```

---

## Project structure

```
apps/hub/
├── src/
│   ├── app/
│   │   ├── about/page.tsx        – Bio + tech stack matrix
│   │   ├── projects/[slug]/page.tsx – Per-project long-form page
│   │   ├── globals.css           – Tailwind + CSS variables
│   │   ├── layout.tsx            – Root layout, font, metadata
│   │   └── page.tsx              – Home (hero + 4 project cards)
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Nav.tsx               – 'use client' for mobile menu toggle
│   │   ├── ProjectCard.tsx
│   │   └── TechBadge.tsx
│   ├── data/
│   │   ├── profile.ts            – Candidate bio + tech stack
│   │   └── projects.ts           – 4 project cards config
│   └── lib/
│       └── cn.ts                 – clsx + tailwind-merge helper
├── tests/
│   └── smoke.test.ts             – Vitest smoke tests
├── public/                       – Static assets (favicon.ico is a placeholder)
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## Pages

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Hero + 4 project cards |
| `/about` | `src/app/about/page.tsx` | Bio, contact links, tech stack matrix |
| `/projects/storefront` | `src/app/projects/[slug]/page.tsx` | Per-project detail (statically generated) |
| `/projects/node-api` | same | |
| `/projects/php-api` | same | |
| `/projects/about` | same | |

The project detail route uses `generateStaticParams` for the four known slugs, so each renders as static HTML at build time. Unknown slugs hit `notFound()` and render the default 404 page.

---

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_STOREFRONT_URL` | `https://hvac-fullstack-portfolio-storefront.vercel.app` | Live storefront link on Storefront card |
| `NEXT_PUBLIC_API_URL` | `https://hvac-fullstack-portfolio-api.onrender.com` | Live GraphQL endpoint on Node API card |
| `NEXT_PUBLIC_PHP_REPO_URL` | `https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/php-api` | GitHub repo link on PHP API card |
| `HUB_ADMIN_TOKEN` | `test-secret` (dev only) | Shared admin token for `/admin/*` sign-in. Required in production (the hub fails closed — see `HUB_ADMIN_TOKEN` in `.env.example`). |
| `PHP_API_URL` | `http://localhost:8000` | Base URL the admin UI calls. Must be `https://` in production. |

Set these in Vercel project settings (or `.env.local` for local dev) after the corresponding apps deploy.

---

## Verification commands

```bash
pnpm --filter hub lint      # ESLint + tsc --noEmit
pnpm --filter hub typecheck # tsc --noEmit
pnpm --filter hub test      # Vitest smoke tests
pnpm --filter hub build     # Next.js production build
```

Smoke tests cover:

- Home page renders with the expected 4 project entries
- Each project slug has a detail page that resolves
- Profile data has all 5 skill categories populated
- Tech badge component renders without crashing

---

## Deploy (Vercel)

`vercel.json` is minimal (build command, framework, region). Connect the GitHub repo in Vercel:

1. Import the `hvac-fullstack-portfolio` repo.
2. Set the root directory to `apps/hub`.
3. Add the three `NEXT_PUBLIC_*` environment variables.
4. Deploy.

Vercel will run `pnpm install` (root) then `pnpm --filter hub build` via Turborepo. Static pages export via `output: 'standalone'` in `next.config.js`.

---

## Notes

- `apps/hub/public/favicon.ico` is a tiny placeholder 16x16 ICO. Replace it with a real favicon before going public.
- No authentication, no payment processing (KTD-7 in the plan). All project URLs are placeholders until U3–U5 deploy.
- Mobile responsiveness via Tailwind mobile-first breakpoints (`sm:`, `md:`, `lg:`). Verified at 375px wide (iPhone SE viewport).

---

## Admin demo

The `/admin/*` routes demonstrate the back-office side of the system — a
non-technical user can list, create, and edit HVAC parts through the browser.

Sign-in token for local dev: **`test-secret`** (the dev fallback when
`HUB_ADMIN_TOKEN` is unset). In production, set `HUB_ADMIN_TOKEN` to a strong
secret — the admin module refuses to load otherwise.

The token is held in an httpOnly cookie scoped to `/admin/*`, so it never
travels with storefront requests.
