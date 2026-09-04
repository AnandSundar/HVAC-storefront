# apps/api — Node.js + GraphQL backend

Live GraphQL API for the HVAC fullstack portfolio. Seeded with 25 products from `@hvac-portfolio/shared-data`. Consumed by the storefront (U3) and inspectable via the GraphQL Playground at the root URL in development.

## Stack

- Node 22 (ESM)
- Express 4
- graphql-yoga 5
- Pothos schema builder (TypeScript-first, end-to-end type safety)
- helmet (security headers)
- cors (configurable via `STOREFRONT_URL`)
- zod (input validation on `createProduct`)

## Endpoints

- `POST /graphql` — GraphQL operations
- `GET /graphql` — GraphiQL Playground (development only)
- `GET /healthz` — liveness probe (Render uses this)

## Operations

| Operation | Type | Description |
|---|---|---|
| `products(category: String): [Product!]!` | query | All products, optional category filter |
| `product(sku: String!): Product` | query | One product by SKU, null if missing |
| `createProduct(input: CreateProductInput!): Product!` | mutation | Admin-only; requires `x-admin-token` header |

## Environment variables

| Var | Required | Description |
|---|---|---|
| `PORT` | no | HTTP port (default `4000`) |
| `NODE_ENV` | no | `development` or `production` (default `development`) |
| `ADMIN_TOKEN` | **yes for mutations** | Shared secret. If unset, all mutations are rejected. |
| `STOREFRONT_URL` | no | Allowed CORS origin in production (default `http://localhost:3001`) |

## Mock admin auth

Mutations require a header `x-admin-token: <ADMIN_TOKEN>`. The header value must equal the `ADMIN_TOKEN` env var exactly. The behavior is **fail-closed**: if `ADMIN_TOKEN` is unset, every mutation is rejected with `403 FORBIDDEN`, even if the header matches anything or is absent. This is deliberate per the security review — we never want a deployment that forgot to set the env var to silently accept mutations.

In production, `ADMIN_TOKEN` is generated automatically by Render (see `render.yaml`).

## Local development

```bash
pnpm install
ADMIN_TOKEN=test-secret pnpm --filter api dev
# Server ready on http://localhost:4000/graphql
```

Then open `http://localhost:4000/graphql` in a browser to use the GraphiQL Playground.

## Local tests

```bash
pnpm --filter api test   # vitest smoke + happy + error paths
pnpm --filter api lint   # eslint + tsc --noEmit
```

## Deployment

One-click deploy to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-org/hvac-fullstack-portfolio/tree/main)

Or manually:

1. Create a new Render → Blueprint → point at this repo.
2. Render reads `apps/api/render.yaml` and provisions the service.
3. Render generates `ADMIN_TOKEN` automatically and injects `STOREFRONT_URL` pointing at the live storefront.

## Production smoke checks

```bash
curl https://<your-service>.onrender.com/healthz
# OK

curl -X POST https://<your-service>.onrender.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ products { sku name } }"}'
# { "data": { "products": [ { "sku": "FURN-001", "name": "..." }, ... ] } }
```

## Project layout

```
apps/api/
├── src/
│   ├── server.ts           # Express + Yoga entry
│   ├── schema/
│   │   ├── builder.ts      # Pothos builder + admin scope
│   │   ├── product.ts      # Product type, queries, mutation
│   │   └── index.ts        # Schema assembly
│   ├── data/
│   │   ├── store.ts        # In-memory product store
│   │   └── seed.ts         # Loads fixtures from @hvac-portfolio/shared-data
│   └── middleware/
│       ├── cors.ts         # CORS configuration
│       └── auth.ts         # Mock admin auth (fail-closed)
├── tests/
│   └── api.test.ts         # Vitest integration tests
├── Dockerfile              # Multi-stage Node 22 alpine
├── render.yaml             # Render Blueprint
├── .env.example
├── tsconfig.json
└── package.json
```