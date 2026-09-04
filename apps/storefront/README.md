# Storefront – Next.js HVAC Parts eCommerce Demo

> Customer-facing HVAC parts catalog that consumes the live Node GraphQL API.
> Built with Next.js 15 App Router, TypeScript strict, TanStack Query, Zustand, and Tailwind v3.

This is the second deployable surface a recruiter visits (after the hub). It demonstrates a complete eCommerce flow — browse, product detail, cart, mock checkout — backed by the live Node GraphQL API on Render.

---

## Stack

- **Next.js 15** (App Router, RSC for product pages, client components for cart + checkout)
- **React 19**
- **TypeScript strict** (`@/*` path alias → `src/*`)
- **Tailwind CSS 3** + shadcn-style tokens
- **TanStack Query v5** for client-side query caching
- **Zustand v5** with `persist` middleware for cart state (localStorage)
- **graphql-request** for the live API fetch (lightweight, fetch-based)
- **Vitest** for unit tests
- **pnpm** workspace package (consumes `@hvac-portfolio/shared-data`)

---

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm --filter storefront dev
```

The storefront boots on http://localhost:3001.

If the Node GraphQL API isn't running on `localhost:4000`, the storefront automatically renders the bundled fixture catalog and shows a **"Showing cached data — live API unavailable"** banner.

To point at the live API:

```bash
NEXT_PUBLIC_API_URL=https://hvac-fullstack-portfolio-api.onrender.com \
  pnpm --filter storefront dev
```

---

## Project structure

```
apps/storefront/
├── src/
│   ├── app/
│   │   ├── products/
│   │   │   ├── page.tsx              – Grouped product grid (RSC)
│   │   │   └── [sku]/page.tsx        – Product detail (RSC)
│   │   ├── cart/
│   │   │   ├── page.tsx              – Cart page shell
│   │   │   └── hydration.tsx         – Client island that renders persisted cart
│   │   ├── checkout/page.tsx         – Mock checkout flow
│   │   ├── providers.tsx             – TanStack Query provider
│   │   ├── globals.css               – Tailwind + CSS variables
│   │   └── layout.tsx                – Root layout, Header, footer
│   ├── components/
│   │   ├── Header.tsx                – Site nav + cart count badge
│   │   ├── ProductCard.tsx           – Grid tile
│   │   ├── ProductGrid.tsx           – Responsive grid + category grouping
│   │   ├── ProductDetail.tsx         – Full product view with specs
│   │   ├── CartItem.tsx              – Single line in the cart
│   │   ├── AddToCartButton.tsx       – Quantity stepper + add action
│   │   └── CartSummary.tsx           – Subtotal / tax / total panel
│   ├── lib/
│   │   ├── cn.ts                     – clsx + tailwind-merge helper
│   │   ├── graphql.ts                – graphql-request client + fetcher
│   │   └── cart.ts                   – Zustand store (persist middleware)
│   └── data/
│       └── fallback-products.ts      – Static catalog used when API is down
├── tests/
│   ├── cart.test.ts                  – Zustand store unit tests
│   └── graphql.test.ts               – Fetcher unit tests
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
| `/products` | `src/app/products/page.tsx` | Product grid grouped by category. Renders 25 fixtures when API is down. |
| `/products/[sku]` | `src/app/products/[sku]/page.tsx` | Full product view. 404 when SKU is unknown to both API and fallback. |
| `/cart` | `src/app/cart/page.tsx` | Hydrated from Zustand. Empty-cart and line-item UI. |
| `/checkout` | `src/app/checkout/page.tsx` | Mock checkout. 1.5s delay then success state. No real payment. |

---

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the Node GraphQL API. Use `https://hvac-fullstack-portfolio-api.onrender.com` in production. |

Set this in the Vercel project settings (or `.env.local` for local dev). The store treats `NEXT_PUBLIC_API_URL + '/graphql'` as the GraphQL endpoint.

---

## Fallback strategy

The storefront must remain demoable even when the Node API is unreachable (Render free-tier cold starts, local dev without the API container). Two helpers in `src/lib/graphql.ts` wrap the live fetches:

- `fetchProductsWithFallback(category?)` — calls `products(category:)`; on error returns the static fixture (filtered when `category` is provided) and flags `usedFallback: true`.
- `fetchProductWithFallback(sku)` — calls `product(sku:)`; on null OR error, consults the fallback fixture. Returns `{ product, usedFallback, notFound }`.

The product list page and product detail page render a yellow `Showing cached data — live API unavailable` banner when `usedFallback === true`.

---

## Cart state

Cart state lives in `useCartStore` (Zustand) with the `persist` middleware:

```ts
useCartStore.getState().addItem(product, qty);
useCartStore.getState().updateQty(sku, qty);
useCartStore.getState().removeItem(sku);
useCartStore.getState().clearCart();
```

Persisted to `localStorage` under the key `hvac-cart`. SSR is safe: a no-op storage stub is used on the server so the first server render is always empty, and the client hydrates from `localStorage` on mount.

---

## Verification commands

```bash
pnpm --filter storefront lint      # ESLint + tsc --noEmit
pnpm --filter storefront typecheck # tsc --noEmit
pnpm --filter storefront test      # Vitest unit tests
pnpm --filter storefront build     # Next.js production build
```

Unit tests cover:

- Cart store: `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCount`, `getSubtotal`
- Cart persists across "page reload" (mocked localStorage)
- GraphQL fetcher: success, transport error, and `null` (not-found) paths

---

## Deploy (Vercel)

`vercel.json` is minimal (build command, framework, region). Connect the GitHub repo in Vercel:

1. Import the `hvac-fullstack-portfolio` repo.
2. Set the root directory to `apps/storefront`.
3. Set `NEXT_PUBLIC_API_URL=https://hvac-fullstack-portfolio-api.onrender.com`.
4. Deploy.

Vercel runs `pnpm install` (root) then `pnpm --filter storefront build` via Turborepo. Static pages export via `output: 'standalone'` in `next.config.js`.

---

## Notes

- No authentication, no payment processing (KTD-7). The checkout page is a mock that displays a success message after a brief delay.
- TypeScript strict with `noUncheckedIndexedAccess: true`. All array access is checked.
- Cart persistence uses Zustand's `persist` middleware, **not** React state — the cart survives full page reloads.