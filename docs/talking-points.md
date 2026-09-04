# Talking points — interview answers per technology

> Written as the answer to: *"Tell me about your portfolio."*
> Each section is one tech from the JD: what I built with it, the key
> decision I made, the trade-off I'd revisit, and the file you can open
> to see it in 60 seconds.

---

## 1. Next.js

**Built with:** [`apps/hub`](https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/hub) and [`apps/storefront`](https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/storefront), both Next.js 15 App Router, React 19, TypeScript strict.

**Key decision:** App Router over Pages Router. Product data is fetched in React Server Components (`apps/storefront/src/app/products/page.tsx`), which means the storefront doesn't need a client-side cache layer for read paths — the data ships pre-rendered. Client components (`AddToCartButton`, `Header`, `CartSummary`) stay thin and isolated to cart interactivity.

**Trade-off I'd revisit:** I dropped TanStack Query mid-build because there is no client-side refetch surface in the current design. If a live-stock or admin surface lands later, I'd add it back then. YAGNI in the meantime.

**60-second file:** [`apps/storefront/src/app/products/page.tsx`](https://github.com/morninganand/hvac-fullstack-portfolio/blob/main/apps/storefront/src/app/products/page.tsx) — server component that fetches via `graphql-request`, maps to grid props, renders `<ProductGrid>`.

---

## 2. Node.js

**Built with:** [`apps/api`](https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/api), Node.js 22, Express 5, `tsx watch` for hot reload.

**Key decision:** In-memory product store seeded from `@hvac-portfolio/shared-data` at module load. The API has no database dependency, so the demo boots on Render free tier without provisioning Postgres. The `mutation createProduct` writes to the in-memory map and survives only until the next cold start — intentional, documented in [`docs/CONTROLS.md`](CONTROLS.md#u4-node-api).

**Trade-off I'd revisit:** Persistence. The mutation is a demo of how GraphQL mutations work; in a real build I'd swap the in-memory store for Prisma + Postgres in one PR. I deliberately scoped this out for the 4-day window.

**60-second file:** [`apps/api/src/server.ts`](https://github.com/morninganand/hvac-fullstack-portfolio/blob/main/apps/api/src/server.ts) — Express app, graphql-yoga handler, helmet, CORS, `/healthz` endpoint.

---

## 3. GraphQL

**Built with:** [`apps/api/src/schema/`](https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/api/src/schema) — schema-first via **Pothos**, served by **graphql-yoga**, consumed by **`graphql-request`** from the storefront.

**Key decision:** Pothos over `graphql-tools`/`@nexus/schema`. Pothos gives a typed builder pattern (`builder.queryField`, `builder.prismaObject`) that stays type-safe end-to-end. The schema definition lives in TypeScript, so refactors propagate to the storefront client automatically — no stringly-typed operation names to drift.

**Trade-off I'd revisit:** Federation. For one service this is overkill; for a real HVAC distribution platform with separate inventory / pricing / orders services, I'd move to Apollo Federation or GraphQL Fusion.

**60-second file:** [`apps/api/src/schema/query.ts`](https://github.com/morninganand/hvac-fullstack-portfolio/blob/main/apps/api/src/schema/query.ts) — `query products(category)` and `query product(sku)` with Zod input validation.

---

## 4. PHP

**Built with:** [`apps/php-api`](https://github.com/morninganand/hvac-fullstack-portfolio/tree/main/apps/php-api) — Laravel 11.56, PHP 8.4, SQLite, Eloquent ORM, Form Requests, API Resources, PHPUnit 11.

**Key decision:** Deliberately different field naming from the Node API — `part_number`, `unit_cost`, `inventory_qty`, `bin_location` instead of the Node API's `sku` / `price` / `stock`. The point is to show that cross-stack integration is a real design problem, not an abstract one. The two APIs are intentionally not isomorphic: an integrator who treats them as interchangeable will fail.

**Trade-off I'd revisit:** SQLite for production. SQLite is right for a demo and a single-tenant internal tool, but the moment you have a second PHP instance or want to run a write-heavy workload, Postgres is the right call. Laravel makes the swap one `.env` line.

**60-second file:** [`apps/php-api/app/Http/Controllers/PartController.php`](https://github.com/morninganand/hvac-fullstack-portfolio/blob/main/apps/php-api/app/Http/Controllers/PartController.php) — index/show/store with Form Request validation, API Resources, and inline mock admin auth using `hash_equals()`.

---

## 5. TypeScript / JavaScript

**Built with:** strict TypeScript across all four Node/Next.js projects. `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `target: ES2022`, `module: ESNext`, and the `@/*` path alias. PHP project is plain PHP 8.4 (Laravel scaffolding).

**Key decision:** One `tsconfig.base.json` at the repo root, each app extends it. This avoids the "five slightly different tsconfigs" drift problem. The Node API uses `tsx` for runtime, the Next.js apps use SWC, the Laravel app is plain PHP — three different runtimes, one shared types package.

**Trade-off I'd revisit:** Monorepo type checking. `turbo run typecheck` runs each app's `tsc --noEmit` in parallel, which is fine at this size. At 20+ packages I'd switch to project references + build mode for incremental typecheck.

**60-second file:** [`tsconfig.base.json`](https://github.com/morninganand/hvac-fullstack-portfolio/blob/main/tsconfig.base.json) — strict, noUncheckedIndexedAccess, ES2022, `@/*` path alias.

---

## Cross-cutting: monorepo tooling

**Built with:** pnpm 11 workspaces + Turborepo 2.x.

**Key decision:** pnpm over npm/yarn. The hard-link store means `pnpm install` is fast, the workspace protocol (`workspace:*`) makes shared packages explicit, and the `allowBuilds` field gives me an audit-friendly view of which dependencies run native postinstall scripts (esbuild, sharp, unrs-resolver).

**Trade-off I'd revisit:** I'd consider Nx or moon if the team grows past ~5 contributors. For a solo portfolio repo, Turborepo's `tasks` definition in `turbo.json` is the right amount of structure.

---

## Cross-cutting: deployment

**Built with:** Vercel for the two Next.js apps (auto-deploy on `main`), Render for the Node API (Docker), one-click Render deploy button for the PHP API.

**Key decision:** Match the platform to the workload. Next.js auto-deploy + preview URLs on Vercel is the highest signal-density option for the storefront. Render's free tier handles the Express + Node API as a Docker container. The PHP API has a one-click Render button so the recruiter can spin up their own instance without needing my account.

**Trade-off I'd revisit:** Render free tier sleeps after 15 minutes of inactivity. I've added a GitHub Actions cron to ping the API every 10 minutes during the interview window — documented in [`docs/runbook.md`](runbook.md#pre-warm-for-demo-day).

---

## Three things I'd build next

1. **Sanctum-authenticated admin route** for the Laravel API so mutations are real, not header-mocked.
2. **Postgres + Prisma** for the Node API so `createProduct` survives restarts.
3. **Playwright smoke tests** covering the storefront happy paths so I don't have to manually re-verify before every demo.

These are documented in [`docs/CONTROLS.md`](CONTROLS.md#deferred-to-follow-up-work).
