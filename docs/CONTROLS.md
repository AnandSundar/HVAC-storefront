# CONTROLS — architecture decisions matrix

> Decision, choice, rationale, alternatives considered, status.
> One entry per significant decision. Status is **accepted** (shipped),
> **deferred** (planned for follow-up), or **rejected** (considered, ruled out).

---

## Monorepo

| Field | Value |
| --- | --- |
| **Decision** | Use a pnpm workspace + Turborepo monorepo. |
| **Choice** | `pnpm@11.5.2` workspaces, `turbo@^2.5.0`. |
| **Rationale** | pnpm's hard-link store and `workspace:*` protocol give me a real monorepo without `lerna` or yarn workspaces. Turborepo gives cached, parallel `lint` / `typecheck` / `test` / `build` across the four apps. |
| **Alternatives considered** | `npm workspaces` — npm 11's lockfile normalisation breaks CI on the npm 10 runners (memory: `kanadojo-windows-npm-11-vs-ci-npm-10.md`). `nx` — too much structure for a 5-package repo. Yarn 4 — same lockfile drift problem as npm. |
| **Status** | accepted |

### allowBuilds allow-list

| Field | Value |
| --- | --- |
| **Decision** | Explicitly allow-list native postinstall scripts. |
| **Choice** | `pnpm-workspace.yaml` declares `allowBuilds: { esbuild: true, sharp: true, unrs-resolver: true }`. |
| **Rationale** | pnpm 11 blocks native postinstall by default. The three listed packages are trusted, transitive deps of Next.js / Vitest / graphql-yoga. The allow-list is auditable in one place. |
| **Alternatives considered** | `--unsafe-perm` — too coarse, would allow everything. Running a one-off `pnpm approve-builds` — produces per-package approval state instead of an in-repo audit trail. |
| **Status** | accepted |

---

## Shared types & fixtures

| Field | Value |
| --- | --- |
| **Decision** | One TS-only source package, no `main`, subpath exports only. |
| **Choice** | `packages/shared-data/package.json` declares `./products`, `./categories`, `./types` — no `.` entry, no compiled output. |
| **Rationale** | Each consumer (hub, storefront, api) imports only what it needs (`@hvac-portfolio/shared-data/products`). No build step, no `dist/` to publish, types flow directly. |
| **Alternatives considered** | Compiled to `dist/` with `tsc` — adds a build step to the Turbo graph without benefit. A single big-bang `index.ts` export — bloats consumer bundles with categories they don't need. |
| **Status** | accepted |

---

## U2 — Hub (Next.js portfolio landing)

| Field | Value |
| --- | --- |
| **Decision** | Next.js 15 App Router + Tailwind v3 + shadcn-style primitives. |
| **Choice** | `app/` router, React 19, `lucide-react` icons, `clsx` + `tailwind-merge` for class composition. |
| **Rationale** | App Router is current Next.js default. Tailwind v3 is the version with the mature plugin ecosystem; v4 is still bedding in. shadcn-style (copy-paste primitives, not the npm package) keeps the bundle small. |
| **Alternatives considered** | Tailwind v4 — alpha at build time, sharper learning-curve risk for a 4-day window. shadcn/ui npm package — adds a CLI and a registry dependency for what is essentially 5 primitives. |
| **Status** | accepted |

### State / data

| Field | Value |
| --- | --- |
| **Decision** | Static fixture data, no fetch layer. |
| **Choice** | `apps/hub/src/data/projects.ts` is hand-written, four entries. |
| **Rationale** | The hub is the recruiter's first page — its data must be correct and never fail. A static file beats a CMS for a 4-page site. |
| **Alternatives considered** | MDX — over-engineered for 4 project pages. Notion / Contentful — adds auth and a vendor. |
| **Status** | accepted |

---

## U3 — Storefront (Next.js HVAC parts)

| Field | Value |
| --- | --- |
| **Decision** | RSC for reads, Zustand for client cart state, no TanStack Query. |
| **Choice** | Server components fetch via `graphql-request`. Cart is a Zustand store with `persist` middleware, `localStorage` key `hvac-cart`. |
| **Rationale** | Read paths are pre-rendered by Next.js — adding TanStack Query for client-side refetch when nothing refetches is YAGNI. Zustand is enough for cart state and survives reload via persist. |
| **Alternatives considered** | TanStack Query everywhere — more code, no client-side queries to cache. Redux Toolkit — heavier than needed for one cart. URL-encoded cart state — bad UX (cart survives navigation issues). |
| **Status** | accepted |

### Fallback path

| Field | Value |
| --- | --- |
| **Decision** | If the API is unreachable, the storefront renders the same 25 products from a static fallback. |
| **Choice** | `apps/storefront/src/data/fallback-products.ts` mirrors `@hvac-portfolio/shared-data/products`. |
| **Rationale** | Render's free tier sleeps after 15 minutes. If the recruiter clicks the storefront mid-sleep, they see the same data instead of a blank grid. The fallback is identical to the API response shape, so the page renders the same JSX. |
| **Alternatives considered** | Show an error — bad demo UX. ISR with 60s revalidate — still requires the API to be awake. |
| **Status** | accepted |

---

## U4 — Node API (Express + GraphQL)

| Field | Value |
| --- | --- |
| **Decision** | Schema-first Pothos on graphql-yoga, in-memory store seeded from shared-data. |
| **Choice** | Pothos builder, graphql-yoga as the Express handler, helmet + cors + zod. `process.env.ADMIN_TOKEN` gates the `createProduct` mutation, fail-closed. |
| **Rationale** | Pothos gives type-safe schema construction without code-gen. graphql-yoga has the simplest Express integration of the major GraphQL servers. In-memory store means zero database setup for the demo. ADMIN_TOKEN env var is the smallest auth surface that demonstrates real auth thinking without rolling a user system. |
| **Alternatives considered** | `@apollo/server` — more setup, no clear win. `graphql-tools` + hand-written SDL — works but loses Pothos's type safety. SQLite + Prisma — adds a migration step for one demo. Real JWT auth — out of scope per U4. |
| **Status** | accepted |

### Mock admin auth

| Field | Value |
| --- | --- |
| **Decision** | Header-based admin token, fail-closed, comparison via `crypto.timingSafeEqual`. |
| **Choice** | `apps/api/src/middleware/auth.ts` reads `process.env.ADMIN_TOKEN`, accepts `x-admin-token` or `X-Admin-Token` headers, returns 401 if unset or mismatched. |
| **Rationale** | Real auth (OAuth, JWT, sessions) is out of scope per [`docs/plans/2026-09-04-001-feat-robert-half-portfolio-plan.md`](plans/2026-09-04-001-feat-robert-half-portfolio-plan.md). The env-var pattern is the closest approximation that doesn't roll its own crypto. |
| **Alternatives considered** | Hardcoded token in source — secrets in git is a non-starter even for a demo. No auth on the mutation — fails the "show real thinking" goal. |
| **Status** | accepted |

---

## U5 — PHP API (Laravel 11)

| Field | Value |
| --- | --- |
| **Decision** | Laravel 11 with deliberately different field naming. |
| **Choice** | `part_number`, `unit_cost`, `inventory_qty`, `bin_location` (vs Node API's `sku` / `price` / `stock`). |
| **Rationale** | The HVAC distribution domain in the JD will have legacy fields, contract-bound field names, and integrator-friendly inconsistencies. Showing that cross-stack naming divergence is a real design problem (not a copy-paste mistake) is part of the demo. |
| **Alternatives considered** | Identical field names — looks like copy-paste, not real integration. Custom field-mapping layer — would hide the divergence instead of confronting it. |
| **Status** | accepted |

### Categories scope

| Field | Value |
| --- | --- |
| **Decision** | PHP API ships only 4 of the 6 categories. |
| **Choice** | Filters, Motors, Controls, Ductwork — no Furnaces or Thermostats in PHP. |
| **Rationale** | The PHP API is a parallel platform for a different part of the business (warehouse / inventory) than the Node API (storefront). Partial overlap is realistic. The hub and storefront consume both APIs and would handle the divergence with feature flags. |
| **Alternatives considered** | Identical 25 products in both APIs — duplicates the data without showing integration thinking. 50 unique products across both APIs — would have made the seed file 2× as large. |
| **Status** | accepted |

### Mock admin auth (PHP)

| Field | Value |
| --- | --- |
| **Decision** | Inline `hash_equals()` comparison in `PartController`, no middleware. |
| **Choice** | `hash_equals($request->header('X-Admin-Token'), env('ADMIN_TOKEN'))` returns 401 on mismatch. |
| **Rationale** | Laravel middleware is overkill for a one-route demo. `hash_equals()` is the canonical PHP timing-safe compare. The env-var pattern mirrors the Node API. |
| **Alternatives considered** | Laravel Sanctum — out of scope, real auth. Custom middleware — more code, no benefit at this scale. |
| **Status** | accepted |

---

## Deployment

| Field | Value |
| --- | --- |
| **Decision** | Vercel for Next.js, Render for Node API, one-click Render for PHP. |
| **Choice** | `apps/hub/vercel.json` and `apps/storefront/vercel.json` for Vercel auto-deploy. `apps/api/render.yaml` for Render blueprint. `apps/php-api/render.yaml` for one-click button. |
| **Rationale** | Match the platform to the workload. Vercel auto-deploy + preview URLs for Next.js is the highest signal-density option. Render free tier handles the Node API as Docker. PHP API ships a deploy button so the recruiter can spin up their own instance without my account. |
| **Alternatives considered** | All on Render — Render free tier allows only one web service per account, so two Next.js apps + Node API would not fit. All on Vercel — Vercel doesn't run long-lived Express servers. |
| **Status** | accepted |

### Render free-tier pre-warm

| Field | Value |
| --- | --- |
| **Decision** | GitHub Actions cron pings the API every 10 minutes during the interview window. |
| **Choice** | `.github/workflows/warmup.yml` runs on cron `*/10 13-23 7-8 9 *` (Sept 7–8, 13:00–23:59 UTC). |
| **Rationale** | Render free tier sleeps after 15 minutes of inactivity. Cold start is 30–60s, which would derail a live demo. |
| **Alternatives considered** | Upgrade to Render paid — $7/month, more than the portfolio is worth. Always-on UptimeRobot — same cron effect but adds a third-party. |
| **Status** | accepted |

---

## Testing

| Field | Value |
| --- | --- |
| **Decision** | Vitest for Node/Next.js, PHPUnit 11 for Laravel. |
| **Choice** | Hub: 14 Vitest tests. Storefront: 32 Vitest tests (cart + graphql fetcher). API: 10 Vitest tests via `executeOperation`. PHP: 11 PHPUnit feature tests, 255 assertions. |
| **Rationale** | Vitest is the dominant Node test runner with first-class TS and ESM support. PHPUnit is Laravel's standard. Both run `turbo run test` / `composer test` from the repo root. |
| **Alternatives considered** | Jest — slower, weaker ESM story. Playwright — deferred per scope. |
| **Status** | accepted |

---

## Scope boundaries

### Deferred to follow-up work

- Real authentication (OAuth, JWT, Laravel Sanctum) — deferred beyond the 4-day window; mock admin auth via header for mutations.
- Real payment processing (Stripe, etc.) — deferred; mock checkout flow only.
- Database persistence for the Node API — in-memory store only for the 4-day window.
- Comprehensive test coverage — smoke tests only; deferred to a follow-up coverage PR.
- CI/CD pipelines beyond the root GitHub Actions — no per-service CI; Render handles its own build/deploy.
- Production-grade observability (logging, metrics, error tracking) — out of scope for a portfolio.
- CMS for product data — static fixtures only.
- E2E Playwright tests — deferred; manual visual verification only for the 4-day window.

### Outside the product's identity

- The portfolio is a **demo**, not a real eCommerce platform. No real customers, no real transactions, no PII handling.
- The portfolio is a **recruiter-facing artifact**. Optimise for clarity and signal density, not for production scalability.
