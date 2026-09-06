---
title: 'feat: Add admin sign-in link to storefront header'
type: feat
status: ready
date: 2026-09-06
---

## Summary

Add an "Admin" link to the storefront's site header
(`apps/storefront/src/components/Header.tsx`) that opens the hub's
`/admin/sign-in` page in a new browser tab. The link target is
configurable via a new `NEXT_PUBLIC_ADMIN_URL` env var (defaulting to
`http://localhost:3000` in dev) so the link survives cross-origin
local + production deploys.

## Problem Frame

During the Sept 8 interview demo, the candidate needs quick access to
the admin sign-in page from the storefront's `/products` view. The
storefront runs on `:3001` and the hub on `:3000`, so a relative path
like `/admin/sign-in` resolves against the storefront origin and 404s.
The site header is the discoverable, persistent location for a nav
link, and `target="_blank"` keeps the storefront context intact while
the admin opens in its own tab.

## Requirements

- **R1.** An "Admin" link appears in the storefront header's nav list,
  positioned before the Cart link.
- **R2.** Clicking the link navigates to
  `${NEXT_PUBLIC_ADMIN_URL}/admin/sign-in` in a new browser tab.
- **R3.** When `NEXT_PUBLIC_ADMIN_URL` is unset, the storefront falls
  back to `http://localhost:3000` in dev for local convenience. In
  production, an unset or non-HTTPS value throws at first render so
  misconfigured deploys fail fast — same posture as `getApiUrl` in
  `apps/hub/src/lib/parts.ts` which rejects non-HTTPS `PHP_API_URL`
  in production.
- **R4.** The link uses `target="_blank"` and `rel="noopener noreferrer"`
  for tab-isolation security.
- **R5.** The link is visually consistent with the existing nav links
  (text + icon, same hover treatment).

## Key Technical Decisions

- **Site header, not page header.** The site `Header` component is
  persistent across pages, so the link is reachable from anywhere —
  matching the "for easy access" framing. The page-level header on
  `/products` is a section title (`<h1>HVAC Parts Catalog</h1>`); a
  second nav link there would be visually noisy.
- **`NEXT_PUBLIC_ADMIN_URL` env var.** Mirrors the existing
  `NEXT_PUBLIC_API_URL` pattern (see
  `apps/storefront/src/lib/graphql.ts`). Inlined at build time, so the
  value is set in Vercel project settings for production — documented
  in `docs/runbook.md` as part of this plan.
- **Plain `<a>`, not Next.js `<Link>`.** Cross-origin means client-side
  routing is irrelevant — a full navigation is what we want, in a new
  tab. Next.js `<Link>` *does* forward `target` and `rel`, but using it
  here would imply client-side routing for an origin the storefront
  doesn't own (routing would resolve against the storefront origin and
  404). A plain anchor also works before hydration, so the link is
  functional on first paint even if JS is slow to load.
- **Always link to `/admin/sign-in`.** Literal interpretation of the
  request. Detecting cross-origin auth state from the storefront (to
  deep-link to `/admin/inventory` when already authenticated) would
  require either a `/me` endpoint on the hub or shared cookies — out of
  scope for this change.
- **Lucide `ExternalLink` icon.** Already in the dependency set via
  `lucide-react`. Reinforces "this opens elsewhere" without
  overshadowing the Cart link's `ShoppingCart` icon.

## Implementation Units

### U1. Add the Admin link to the site header

**Goal:** Render an "Admin" link in the storefront site header that
opens the admin sign-in page in a new tab, reading the target URL from
the `NEXT_PUBLIC_ADMIN_URL` env var.

**Files:**
- `apps/storefront/src/components/Header.tsx` (modify — add the link)
- `apps/storefront/tests/Header.test.tsx` (create — coverage)
- `apps/storefront/package.json` (modify — add `@vitejs/plugin-react`,
  `@testing-library/react`, `@testing-library/jest-dom` to
  `devDependencies`)
- `apps/storefront/tests/setup.ts` (create — jest-dom matchers wire-up)
- `apps/storefront/vitest.config.ts` (create — explicit setup-files
  entry, replaces the inline `vitest` config in `package.json`)
- `docs/runbook.md` (modify — add `NEXT_PUBLIC_ADMIN_URL` row to the
  `apps/storefront` env table)

**Approach:**

1. **`Header.tsx`:**
   - Add `ExternalLink` to the existing `lucide-react` import.
   - Introduce a module-level `ADMIN_SIGN_IN_PATH = '/admin/sign-in'`
     constant at the top of the file with the other implicit
     constants.
   - Read `process.env.NEXT_PUBLIC_ADMIN_URL` inside the component
     body. `NEXT_PUBLIC_*` vars are inlined at build time by Next.js
     (the value baked into the bundle comes from the Vercel project
     settings, not from a `.env` file in the deployed environment),
     so call-time vs. module-eval-time placement has zero runtime
     effect — both forms resolve to the same baked-in string. The
     placement matches `getApiUrl` in
     `apps/storefront/src/lib/graphql.ts` for codebase consistency,
     not because it changes behavior.
   - Compute `adminUrl` with a `?? 'http://localhost:3000'` fallback
     for dev. In production builds (`process.env.NODE_ENV === 'production'`),
     if `adminUrl` starts with `http://localhost` or is not `https://`,
     throw a descriptive error so the deploy fails loud rather than
     silently shipping a broken link. Mirrors the fail-loud check in
     `apps/hub/src/lib/parts.ts#getApiUrl`.
   - Add a new `<li>` to the existing `<ul>`, positioned before the
     Cart `<li>`. Inside, render a plain `<a>` (not `<Link>`) with:
     - `href={`${adminUrl}${ADMIN_SIGN_IN_PATH}`}`
     - `target="_blank"`
     - `rel="noopener noreferrer"`
     - `aria-label="Admin sign-in (opens in a new tab)"`
     - The same Tailwind classes as the existing nav links for visual
       consistency.
   - Inside the anchor, render the `ExternalLink` icon (4×4, same as
     `ShoppingCart`) followed by a `<span className="hidden sm:inline">Admin</span>`.

2. **Test setup (`vitest.config.ts` + `tests/setup.ts`):**
   - Move the inline `vitest` config out of `package.json` into
     `vitest.config.ts` (cleaner and supports setup-files).
   - Add `setupFiles: ['./tests/setup.ts']`.
   - In `setup.ts`, import `@testing-library/jest-dom/vitest` to
     register the matchers (`toBeInTheDocument`, etc.).
   - Keep the existing `environment: 'happy-dom'` and `@` alias.

3. **Tests (`tests/Header.test.tsx`):**
   - Render `<Header />` using `render` from `@testing-library/react`.
   - Assert the Admin link exists, has the expected `href`, `target`,
     and `rel` attributes, and carries the `aria-label`.
   - Cover both env-var states (unset and set) by reassigning
     `process.env.NEXT_PUBLIC_ADMIN_URL` inside `beforeEach` /
     `afterEach`. The unset case should expect
     `http://localhost:3000/admin/sign-in`.
   - Cover the cart-count badge edge case is untouched (assert no
     regression on the existing cart behavior).

4. **`docs/runbook.md`:**
   - In the `apps/storefront (Next.js)` env table, add a row for
     `NEXT_PUBLIC_ADMIN_URL` (required: no, default: `http://localhost:3000`,
     purpose: "Admin sign-in URL, opens in a new tab from the storefront
     header. Set to your hub's canonical URL in prod (e.g.,
     `https://hvac-fullstack-portfolio-hub.vercel.app`).").

**Test scenarios (U1):**
- Renders an `<a>` with text "Admin" in the header nav — happy path
- Link `href` is `http://localhost:3000/admin/sign-in` when
  `NEXT_PUBLIC_ADMIN_URL` is unset — default URL
- Link `href` is `<env-value>/admin/sign-in` when
  `NEXT_PUBLIC_ADMIN_URL` is set to a custom value — env-var override
- Link has `target="_blank"` — opens in a new tab
- Link has `rel="noopener noreferrer"` — tab-isolation security
- Link carries `aria-label="Admin sign-in (opens in a new tab)"`
  — accessibility hint for screen reader users
- Link renders an `ExternalLink` icon alongside the text — visual
  affordance
- Cart link still works (positive regression check that `<Link>` to
  `/cart` is unaffected) — regression coverage

**Verification:** `pnpm --filter storefront test` passes the new file
without breaking `cart.test.ts` or `graphql.test.ts`. Manually run
`pnpm --filter storefront dev`, open `http://localhost:3001`,
confirm the Admin link is visible in the header before the Cart link,
click it, confirm it opens `http://localhost:3000/admin/sign-in` in a
new tab with the original storefront tab intact.

**Patterns to follow:**
- `apps/storefront/src/lib/graphql.ts#getApiUrl` — read env at call
  time, not module-eval time.
- Existing nav links in `Header.tsx` — same Tailwind classes for
  visual consistency; existing icon sizing convention at `Header.tsx:48`
  (`h-4 w-4` for inline-with-text icons).

## Scope Boundaries

**Out of scope:**
- Detecting "already signed in" state on the hub to deep-link to
  `/admin/inventory` — would require a cross-origin session endpoint
  on the hub (separate plan).
- A "Staff" dropdown menu with multiple admin links (e.g., inventory,
  settings) — overkill for one link.
- Hiding the link in production environments — this is a portfolio
  demo, not real eCommerce, and the link is useful for the candidate
  during the demo.
- A logout flow — the admin uses a shared token (no session), so
  logout is just "close the tab".
- Localizing the "Admin" label.

## Risks & Dependencies

- **`NEXT_PUBLIC_*` env vars are inlined at build time.** A missing
  var in Vercel silently falls back to the localhost default at
  runtime. **Mitigation:** the production build throws when the
  resolved URL is `localhost` or non-HTTPS, matching the `getApiUrl`
  fail-loud posture in `apps/hub`. The throw turns "missed env var"
  into a visible build failure rather than a quiet broken link in
  production. `docs/runbook.md` documents the env var for the
  happy-path setup.
- **`target="_blank"` security.** Browsers default to protecting
  against tab-napping as of Chrome 88+, but explicit
  `rel="noopener noreferrer"` is still the safe default and what the
  linter expects. The test scenario above asserts it.
- **`@testing-library/react` is a new dev dependency.** Adds ~1 MB to
  `pnpm install` time. Acceptable for a portfolio demo.
- **Vitest config migration from `package.json` to `vitest.config.ts`.**
  Functionally equivalent (the same options move across), but it's a
  config change. The existing tests use no Vitest-specific options
  beyond what already lives in `package.json` (which we replicate
  verbatim), so they should continue to pass unchanged.
