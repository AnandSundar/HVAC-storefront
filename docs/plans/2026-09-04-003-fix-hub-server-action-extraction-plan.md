---
title: fix — extract submitPartAction out of parts.ts so client components can import it without bundling server-only utilities
date: 2026-09-04
type: fix
status: planned
origin: docs/plans/2026-09-04-002-feat-admin-inventory-ui-plan.md
---

# Plan — Extract `submitPartAction` to `apps/hub/src/lib/parts-actions.ts`

## Summary

U4 of the admin UI plan shipped `apps/hub/src/lib/parts.ts` with two conflicting contracts in the same module: `import 'server-only'` at line 1 (which forbids client bundling) and an inline `'use server'` directive on `submitPartAction` at line 304. Because `PartForm.tsx` is a `'use client'` component that imports the action, Next.js tries to bundle `parts.ts` for the client and rejects both.

The fix is the canonical Next.js 15 pattern: server actions imported by client components must live in a dedicated module with a file-top `'use server'` directive. Mixing them with `server-only` utilities in the same module forces the client bundler to try to compile a module it can't.

This is a regression-only fix. No new feature work, no API contract changes, no UI changes. Three small units: extract, repoint, verify.

## Problem Frame

The recruiter demo flow (`pnpm turbo run dev`, sign in at `test-secret`, list → new → edit → sign out) is broken at build time. Two stack errors from a single root cause:

1. `parts.ts:1` — `import 'server-only'` triggers *"You're importing a component that needs 'server-only'. That only works in a Server Component..."*
2. `parts.ts:304` — inline `'use server'` inside `submitPartAction` triggers *"It is not allowed to define inline 'use server' annotated Server Actions in Client Components."*

The admin UI plan's own "Patterns to follow" note (U1 §Patterns) called for inline `'use server'` specifically because the file mixes server actions with regular server-only functions. That guidance was wrong for this shape — server actions consumed by client components must live in a dedicated file. The original plan delivered the build error this fix plan resolves.

**Verified blast radius:** only `PartForm.tsx` (a client component) imports `submitPartAction` from `parts.ts`. The other three importers — `PartsTable.tsx`, `inventory/page.tsx`, `inventory/[part]/page.tsx` — are either server components or import a type-only `Part`. Neither path pulls `server-only` into a client bundle.

## Requirements

| ID | Requirement |
|---|---|
| R1 | `pnpm turbo run build --filter=hub` succeeds with no `server-only` or inline `'use server'` errors. |
| R2 | `pnpm turbo run test --filter=hub` reports 68/68 passing (61 baseline + 7 `submitPartAction` cases), unchanged from before the regression. |
| R3 | `pnpm turbo run typecheck --filter=hub` is clean. |
| R4 | `pnpm turbo run lint --filter=hub` is clean. |
| R5 | The recruiter demo walkthrough (sign-in → list → new → edit → sign-out) succeeds against `pnpm turbo run dev` with `HUB_ADMIN_TOKEN=test-secret`. |
| R6 | No Claude-Code footer in the commit body (memory rule). |
| R7 | Commit only files in this plan's `Files:` lists (memory rule). |

## Key Technical Decisions

### KTD-1 — Dedicated actions file (`parts-actions.ts`), not a re-export

`parts.ts` keeps its `import 'server-only'` guard and stays as the data-utility module (types, fetchers, form-data coercers, `PartsFetchError`). The action moves to a new file `apps/hub/src/lib/parts-actions.ts` with a file-top `'use server'` directive that makes every export an RPC.

We do **not** add a re-export from `parts.ts` — the client component imports directly from `@/lib/parts-actions`. A re-export would still cause `parts.ts` to enter the client bundle (Next.js resolves the transitive import chain), defeating the fix.

### KTD-2 — The action's imports stay narrow

`parts-actions.ts` imports only what the action needs:

- From `./parts`: `createPart`, `updatePart`, `PartsFetchError`, `formDataToCreateInput`, `formDataToUpdateInput`, `type Part`. The server-only utilities stay accessible from server-side consumers unchanged.
- From `./part-schema`: `createPartSchema`, `updatePartSchema`.
- From `next/cache`: `revalidatePath` (moves with the action).
- The two private helpers — `issuesToFieldErrors` and `fetchErrorToState` — move with the action since they are only used by it.

### KTD-3 — No signature change

The action's public signature stays `(mode, partNumber, token, _prev, formData) => Promise<{ ok: true; redirectTo } | { ok: false; fieldErrors; error? }>`. `PartForm.tsx`'s `.bind(null, mode, partNumber ?? null, token)` call site is unchanged. The fix is purely structural.

## Implementation Units

### U1. Create `apps/hub/src/lib/parts-actions.ts`; remove the action from `parts.ts`

**Goal:** Move `submitPartAction` and its two private helpers (`issuesToFieldErrors`, `fetchErrorToState`) into a new module whose file-top `'use server'` directive makes every export an RPC.

**Files:**
- `apps/hub/src/lib/parts-actions.ts` (NEW). File-top `'use server'` as the first non-blank line. Imports from `./parts`, `./part-schema`, `next/cache`. Exports `submitPartAction` with the same signature.
- `apps/hub/src/lib/parts.ts` (MODIFIED). Remove `submitPartAction` (current lines 294–339), `issuesToFieldErrors` (lines 341–348), `fetchErrorToState` (lines 350–358). Remove the now-unused `revalidatePath` import (line 2). Keep everything else: `import 'server-only'`, the `Part` and `PartsListResponse` interfaces, `PartsFetchError`, the four fetchers (`listParts`, `getPart`, `createPart`, `updatePart`), and the two form-data coercers (`formDataToCreateInput`, `formDataToUpdateInput`).

**Approach:**
- The new file is short — under 100 lines including imports.
- Header is exactly two lines: `'use server';` followed by an import block. No JSDoc on the file itself.
- The action's JSDoc block (current lines 281–293 in `parts.ts`) moves with the function.

**Test scenarios:**
- *File shape:* the first non-blank line of `parts-actions.ts` is `'use server';`.
- *No stale references:* `parts.ts` no longer contains the strings `submitPartAction`, `issuesToFieldErrors`, `fetchErrorToState`, or `revalidatePath`.
- *No regression:* server-side consumers (`inventory/page.tsx`, `inventory/[part]/page.tsx`) still import `listParts` and `getPart` from `@/lib/parts` and work unchanged.

### U2. Repoint `PartForm.tsx` import to `@/lib/parts-actions`

**Goal:** The client form imports the action from the new module so the bundler never resolves the chain back into `parts.ts`.

**Files:**
- `apps/hub/src/components/admin/PartForm.tsx` (MODIFIED). Line 7 changes from `import { submitPartAction } from '@/lib/parts';` to `import { submitPartAction } from '@/lib/parts-actions';`. No other edits.

**Approach:**
- Single-line edit. The `.bind(null, mode, partNumber ?? null, token)` call site is unchanged. The `FormState` type stays local to the component. No new imports needed (the action's return type is unchanged).

**Test scenarios:**
- *Import target:* `PartForm.tsx` line 7 references `@/lib/parts-actions`.
- *No leftover imports:* `PartForm.tsx` does not import any other named export from `@/lib/parts`.

### U3. Move the action's test imports + verify build green

**Goal:** The seven `submitPartAction` tests now import from the new module. Build, typecheck, lint, and test all green.

**Files:**
- `apps/hub/tests/admin/parts.test.ts` (MODIFIED). The seven `submitPartAction` test cases (lines ~297–475) currently `await import('../../src/lib/parts')` inside the action's `describe` blocks. Change those imports to `await import('../../src/lib/parts-actions')`. Helper tests (`formDataToCreateInput`, `formDataToUpdateInput`, `listParts`, `getPart`, `createPart`, `updatePart`) keep importing from `'../../src/lib/parts'` — they were never moved.

**Approach:**
- Group the action's seven tests under one early `await import(...)` at the top of the first `submitPartAction` describe block, then reuse the bound symbol across all the action's tests via a per-describe `const { submitPartAction } = await ...;`. This keeps the diff narrow and the test file's existing style unchanged.
- Run `pnpm turbo run test typecheck lint --filter=hub` from the repo root to verify all three are green before committing.

**Test scenarios:**
- *Test count:* `pnpm turbo run test --filter=hub` reports 68/68 passing (61 baseline + 7 `submitPartAction` cases).
- *Build:* `pnpm turbo run build --filter=hub` succeeds; no `server-only` or inline `'use server'` errors.
- *Typecheck:* `pnpm turbo run typecheck --filter=hub` is clean.
- *Lint:* `pnpm turbo run lint --filter=hub` is clean.
- *Demo walkthrough:* `pnpm turbo run dev`, sign in at `test-secret`, add a part, edit a part, sign out — full flow succeeds.

**Verification:**
- All four commands above green.
- Manual walkthrough succeeds against `pnpm turbo run dev`.
- Commit message has no `🤖 Generated with [Claude Code]` footer.
- Commit scope contains only files in U1–U3's `Files:` lists.

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| A re-export from `parts.ts` would re-introduce the bundle problem | KTD-1 explicitly forbids re-exports. `PartForm.tsx` imports directly from `@/lib/parts-actions`. |
| `revalidatePath` left as a stale import in `parts.ts` after the action moves | U1's file list explicitly removes the import; the U1 test scenario asserts no `revalidatePath` reference remains. |
| A future contributor adds another client-side importer of `submitPartAction` from `@/lib/parts` | The action no longer lives at `@/lib/parts` after this fix; the TypeScript import would fail at compile time, surfacing the error before runtime. |
| The hub's existing `apps/hub/src/lib/admin-token-actions.ts` already uses file-top `'use server'` | U1 follows the same pattern. No new convention introduced. |

**Dependencies:**
- PHP API: untouched.
- Other apps (storefront, node-api): untouched.
- Next.js 15.1.4: unchanged.
- No new runtime dependencies. No new dev dependencies. No `package.json` changes.

## Scope Boundaries

### In scope

- The single-file extraction of `submitPartAction` and its two private helpers.
- The one-line import change in `PartForm.tsx`.
- The seven `submitPartAction` test imports moved to the new module.

### Deferred for later (intentionally out of this plan)

- Splitting `parts.ts` further into `parts-types.ts` / `parts-fetchers.ts` / `parts-helpers.ts`. Two files is enough; a directory layout is overkill.
- Documenting the cross-stack "server actions live in their own file" pattern in `docs/solutions/`. The original plan deferred this chore; this fix doesn't unblock it.
- Refactoring the other admin actions (`signInAction`, `signOutAction`) in `admin-token-actions.ts`. They already live in a dedicated file with file-top `'use server'`; no change needed.

### Outside this fix's identity

- Rewriting the admin UI plan's "Patterns to follow" guidance for server-action placement. That's a plan-doc edit, not code work — out of scope.
- Diagnosing or fixing any other latent build issues. If `pnpm turbo run build` surfaces anything else after this fix lands, that's a separate plan.

## Acceptance Examples

| ID | Description |
|---|---|
| AE1 | `pnpm turbo run build --filter=hub` succeeds with no `server-only` or inline `'use server'` errors. |
| AE2 | `pnpm turbo run test --filter=hub` reports 68/68 passing. |
| AE3 | The recruiter signs in at `test-secret`, sees the seeded parts, adds a new part, edits its qty, and signs out — full flow works. |

## Operational / Rollout Notes

- **Local dev:** `pnpm turbo run dev` boots all four apps. Sign in at `test-secret`. The flow that broke at build time is restored.
- **Production:** no env-var or deployment changes. The hub was already shipping with this code; the fix is local to the bundler.
- **Commit hygiene:** one commit for the fix (U1–U3 share a `Files:` list that's small and tightly coupled). Conventional prefix `fix(hub):`. No Claude-Code footer (memory rule). Commit scope contains only the three units' files (memory rule).

## Sources & Research

- **Next.js 15 docs (load-bearing):** server actions invoked from client components must live in a module with file-top `'use server'`. Mixing them with `server-only` utilities in the same module is not supported — the client bundler rejects both the `server-only` import and the inline `'use server'` directive.
  - https://nextjs.org/docs/app/getting-started/mutating-data
  - https://nextjs.org/docs/app/api-reference/directives/use-server
- **Repo research (load-bearing):** the hub's existing `apps/hub/src/lib/admin-token-actions.ts` already uses the file-top `'use server'` pattern. The fix mirrors that file's structure.
- **Institutional learnings:** `docs/solutions/` does not exist. The post-ship recommendation (deferred) is to capture this regression's lesson — *"server actions consumed by client components must live in a dedicated file with file-top `'use server'`; never inline the directive inside a module that also has `import 'server-only'`"* — as a new entry under `docs/solutions/architecture_patterns/`.
