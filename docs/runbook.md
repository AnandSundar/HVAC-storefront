# Runbook — deploy, env vars, troubleshooting

> How to run the portfolio locally, deploy it to Vercel + Render, and fix
> the three things that go wrong most often.

---

## Local quick start

```bash
# 1. Install pnpm 11 if you don't have it
corepack enable
corepack prepare pnpm@11.5.2 --activate

# 2. Clone and install
git clone https://github.com/AnandSundar/hvac-fullstack-portfolio.git
cd hvac-fullstack-portfolio
pnpm install

# 3. Boot all four apps in parallel via Turborepo
pnpm dev
```

| App | Port | URL |
| --- | --- | --- |
| Hub (Next.js) | 3000 | http://localhost:3000 |
| Storefront (Next.js) | 3001 | http://localhost:3001 |
| Node GraphQL API | 4000 | http://localhost:4000/graphql |
| PHP REST API | 8000 | http://localhost:8000/api/parts |

If you only want one app: `pnpm --filter api dev` (or `hub`, `storefront`, `php-api`).

---

## Environment variables

### `apps/api` (Node GraphQL)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `4000` | Express listen port |
| `ADMIN_TOKEN` | **yes for mutations** | (none) | Required for `createProduct`. Mutations fail-closed if unset. |
| `CORS_ORIGIN` | no | `*` | Comma-separated allow-list. Set to your storefront URL in prod. |
| `NODE_ENV` | no | `development` | `production` on Render. |

### `apps/storefront` (Next.js)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | no | (none) | GraphQL endpoint. If unset, falls back to `data/fallback-products.ts`. |
| `NEXT_PUBLIC_ADMIN_URL` | no | `http://localhost:3000` | Admin sign-in URL. The storefront header renders an "Admin" link that opens `${NEXT_PUBLIC_ADMIN_URL}/admin/sign-in` in a new tab. Set to your hub's canonical URL in prod (e.g., `https://hvac-fullstack-portfolio-hub.vercel.app`). Production builds throw at first render if this resolves to `localhost` or non-HTTPS — fail-loud, mirroring `getApiUrl` in `apps/hub`. |
| `PORT` | no | `3001` | Listen port. |

> `NEXT_PUBLIC_*` vars are inlined at build time by Next.js. Set them in Vercel
> project settings, not in `.env.local` after deploy.

### `apps/hub` (Next.js)

No required env vars. The hub is fully static.

### `apps/php-api` (Laravel)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `APP_KEY` | **yes** | (generated) | `php artisan key:generate` locally; Render injects at deploy. |
| `APP_URL` | yes | `http://localhost` | Public URL. Render sets this automatically. |
| `ADMIN_TOKEN` | **yes for store/destroy** | (none) | Required for `POST /api/parts`. Fail-closed. |
| `DB_CONNECTION` | no | `sqlite` | `sqlite` for demo, `pgsql` for production. |

---

## Deploy

### Hub + Storefront → Vercel

1. Sign in to Vercel, "Add New Project", import `AnandSundar/hvac-fullstack-portfolio`.
2. **For the hub:** set Root Directory to `apps/hub`, Framework Preset to Next.js. Override build command to `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter hub build` if the monorepo install complains.
3. **For the storefront:** same as above with Root Directory `apps/storefront`. Set `NEXT_PUBLIC_API_URL` to your Render API URL.
4. Deploy. Both auto-deploy on push to `main`.

> If Vercel can't find the workspace, add `pnpm-workspace.yaml` to the build
> include paths in Project Settings → General.

### Node API → Render

1. Sign in to Render, "New" → "Blueprint".
2. Connect the repo, point to `apps/api/render.yaml`.
3. Set `ADMIN_TOKEN` in the Environment tab.
4. Render builds the Dockerfile and deploys on push to `main`.

### PHP API → Render one-click

The `apps/php-api/render.yaml` includes a deploy button that any Render user can click:

```markdown
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AnandSundar/hvac-fullstack-portfolio/tree/main/apps/php-api)
```

This forks the repo into the recruiter's account and creates a Laravel service.
They set `APP_KEY` (Render generates it) and `ADMIN_TOKEN` themselves.

---

## Pre-warm for demo day

Render free tier sleeps after **15 minutes** of inactivity. Cold start is 30–60 seconds — a guaranteed demo killer.

**Solution:** GitHub Actions cron pings `/healthz` every 10 minutes during the interview window.

`.github/workflows/warmup.yml` (already in the repo):

```yaml
name: Pre-warm Render API
on:
  schedule:
    - cron: '*/10 13-23 7-8 9 *'
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Wake up the API
        run: |
          curl -fsS https://hvac-fullstack-portfolio-api.onrender.com/healthz
```

The cron fires every 10 minutes between 13:00 UTC and 23:59 UTC on Sept 7 and Sept 8, 2026. Adjust the cron expression if your interview is at a different time.

> GitHub Actions cron can have ±5–10 minute drift. The 10-minute interval
> is well within the 15-minute sleep window.

---

## Troubleshooting

### Symptom: "CORS error" in browser console

**Cause:** The Node API blocks cross-origin requests from a domain not in `CORS_ORIGIN`.

**Fix:**
1. Check the storefront URL you're visiting (e.g., `hvac-fullstack-portfolio-storefront.vercel.app`).
2. Set `CORS_ORIGIN=https://hvac-fullstack-portfolio-storefront.vercel.app` in the Render service env.
3. Restart the Render service (env vars don't hot-reload).

If you see this in dev, `apps/api` defaults to `CORS_ORIGIN=*` in dev mode, but you can override via `.env`.

### Symptom: Storefront shows products but API requests 404

**Cause:** `NEXT_PUBLIC_API_URL` is unset or wrong.

**Fix:** The storefront **does not** need this to render — it falls back to `src/data/fallback-products.ts`. If you see the products but want them to come from the live API:
1. Vercel → Storefront project → Settings → Environment Variables.
2. Set `NEXT_PUBLIC_API_URL` to the Render URL ending in `/graphql`.
3. Redeploy.

### Symptom: `createProduct` mutation returns 401

**Cause:** `ADMIN_TOKEN` is not set on Render, or the header is missing/mismatched.

**Fix:**
1. Render → API service → Environment → confirm `ADMIN_TOKEN` is set.
2. From the GraphQL playground, send the header:
   ```json
   { "x-admin-token": "<value-of-ADMIN_TOKEN>" }
   ```
3. Both `x-admin-token` and `X-Admin-Token` are accepted (case-insensitive header).

### Symptom: `pnpm install` fails with "esbuild: set this to true or false"

**Cause:** A fresh checkout of `pnpm-workspace.yaml` has placeholder `allowBuilds` values.

**Fix:** Open `pnpm-workspace.yaml` and replace each placeholder with `true`:

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
```

These three are trusted transitive deps of Next.js / Vitest / graphql-yoga. See [`docs/CONTROLS.md`](CONTROLS.md#allowbuilds-allow-list) for rationale.

### Symptom: Build fails on Vercel with "Cannot find module @hvac-portfolio/shared-data"

**Cause:** Vercel isn't running the monorepo install.

**Fix:** Vercel Project Settings → General → Build & Development Settings → Override:

- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter hub build` (or `storefront`)

This walks up to the repo root, runs the workspace install, then builds only the app Vercel is responsible for.

### Symptom: PHP API shows "Database file not found" on Render

**Cause:** SQLite file is ephemeral on Render free tier — it resets on every deploy.

**Fix (demo only):** Accept it — the seed data is re-imported via `php artisan db:seed --force` in the Render start command. **Fix (production):** Switch `DB_CONNECTION=pgsql` and provision a Render Postgres instance.

### Symptom: Storefront dev server boots but `/products` shows empty grid

**Cause:** The Node API is not running on port 4000. The fallback path renders 25 products, so an empty grid means a JS error.

**Fix:**
1. Open browser devtools → Console.
2. Look for hydration errors or fetch failures.
3. Confirm `pnpm --filter api dev` is running. If you only ran `pnpm --filter storefront dev`, the API isn't up.

---

## What to do on demo day

1. **30 minutes before:** visit `https://hvac-fullstack-portfolio-hub.vercel.app` from your interview machine. Click through to the storefront, load a product, add to cart. Confirms the warm-up cron is doing its job.
2. **5 minutes before:** have these tabs open:
   - Hub (recruiter landing)
   - Storefront product grid
   - Storefront product detail (so the GraphQL query is visible in devtools)
   - GraphQL playground (`/graphql` on Render)
   - GitHub repo (so you can show the file structure)
3. **If the API is down:** the storefront still works — the fallback path keeps all 25 products rendered. Mention this as a feature, not a bug.
4. **If everything is down:** open `docs/diagrams/data-flow.svg` and walk through the architecture from the diagram. The code is the evidence; the live demo is the polish.

---

## Repository layout reference

```
hvac-fullstack-portfolio/
├── apps/
│   ├── hub/                Next.js 15 portfolio landing (Vercel)
│   ├── storefront/         Next.js 15 HVAC eCommerce (Vercel)
│   ├── api/                Node 22 + graphql-yoga + Pothos (Render)
│   └── php-api/            Laravel 11 + SQLite (Render one-click)
├── packages/
│   └── shared-data/        TS types + 25 HVAC fixtures
├── docs/
│   ├── README.md           30-second pitch
│   ├── talking-points.md   interview answers per tech
│   ├── CONTROLS.md         architecture decision matrix
│   ├── diagrams/
│   │   ├── architecture.svg
│   │   ├── data-flow.svg
│   │   └── deploy.svg
│   ├── runbook.md          this file
│   ├── solutions/          institutional learnings (searchable by frontmatter)
│   └── plans/
│       └── 2026-09-04-001-feat-robert-half-portfolio-plan.md
├── .github/
│   └── workflows/
│       ├── ci.yml          lint + typecheck + test + build
│       └── warmup.yml      Render pre-warm cron
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```
