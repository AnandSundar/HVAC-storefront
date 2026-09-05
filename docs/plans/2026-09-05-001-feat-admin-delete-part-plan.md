---
title: feat(admin): add delete-part to PHP API and hub admin UI
type: feat
date: 2026-09-05
---

## Summary

Add admin delete capability to the HVAC inventory: a `DELETE /api/parts/{part}` endpoint on the PHP API gated by the existing admin-token check, and a Delete button on the hub's edit page (far right of Save Changes) with inline two-step confirmation. On success the user lands back on the inventory list with a success banner.

## Problem Frame

The admin UI shipped in plan 002 explicitly deferred delete — under "Deferred for later → Delete": "no `DELETE /api/parts/{part}` exists yet; a follow-up plan would add it to PHP API then the hub UI." This plan is that follow-up. The user's request specified placement ("far right of the Save Changes button") and the confirmation pattern (inline two-step); the rest falls out of the established hub/PHP conventions surfaced during repo research.

## Requirements

### Backend

- R1. `DELETE /api/parts/{part}` is implemented in `apps/php-api/app/Http/Controllers/PartController.php` as `destroy()` and routes via `apps/php-api/routes/api.php`.
- R2. The DELETE endpoint reuses `PartController::adminTokenIsValid($request)` exactly — same `403 {error: 'Admin authentication required'}` response shape that store/update use.
- R3. Successful DELETE returns `204 No Content` with no body.
- R4. A missing part returns `404` via Laravel's `firstOrFail` route binding (configured in `apps/php-api/bootstrap/app.php`).
- R5. CORS allows `DELETE` in `apps/php-api/config/cors.php` so the browser preflight succeeds.

### Hub data layer

- R6. `apps/hub/src/lib/parts.ts` exposes `deletePart(token, partNumber): Promise<void>` that DELETEs `/api/parts/{encoded part_number}`, attaches `X-Admin-Token`, and maps non-2xx into `PartsFetchError` mirroring the `getPart` shape.
- R7. `apps/hub/src/lib/parts-actions.ts` exposes `deletePartAction(partNumber, token)` (file-top `'use server'`) that calls `deletePart`, calls `revalidatePath('/admin/inventory')` on success, and returns `{ok: true, redirectTo: '/admin/inventory?deleted=<encoded sku>'}` or `{ok: false, error: string}`.
- R8. The action does not run Zod validation — DELETE has no body. The existing `fetchErrorToState` mapping covers 403 and 404 error cases.

### Hub UI

- R9. `apps/hub/src/components/admin/PartForm.tsx` renders Save Changes and Delete as **sibling `<form>` elements** under a `flex justify-between` wrapper div — NOT a nested form inside the edit form (HTML disallows nested forms; browsers silently drop the inner one). The Save Changes button moves out of the outer edit-form container into its own root-level `<form>`; the Delete `<form>` is bound to `deletePartAction.bind(null, partNumber, token)` per KTD-7. Each button owns its own form so `useFormStatus` reads its own pending state. Mirrors the `SignOutButton.tsx` pattern.
- R10. Clicking Delete toggles the action row state: Save Changes stays visible, Delete becomes "Cancel" (outline destructive — same shape as the original Delete button, just the label and onClick change), and a "Confirm Delete" button (filled destructive) appears beside it. Clicking Cancel reverts the row to Save + Delete (Cancel re-attaches the original Delete onClick, restoring the initial state). Clicking Confirm Delete fires `deletePartAction`.
- R11. On confirm: disable the active Delete-form button (Cancel or Confirm Delete — only one is visible at a time) with `aria-busy='true'` while the action is pending; the Save Changes button also disables to prevent concurrent edits (the row visually shows "Deleting…" on the Delete side and a disabled primary on the Save side). On success navigate to the redirect URL via `router.push`; on error surface it in the Delete form's own alert at the top of the actions row — the Delete form is a sibling of the edit form and cannot write to the edit form's `useActionState` `state.error`.
- R12. `apps/hub/src/app/admin/inventory/page.tsx` renders a `?deleted=<sku>` success banner parallel to the existing `?created` and `?updated` banners. The `SuccessBanner` `kind` union and verb mapping extend to include `'deleted'`. Replace the `kind === 'created' ? 'created' : 'updated'` ternary at `page.tsx:70` with an exhaustive `Record`-keyed map (`const verbs: Record<SuccessBannerProps['kind'], string> = { created: 'created', updated: 'updated', deleted: 'deleted' }; const verb = verbs[kind];`) so future union extensions fail TypeScript rather than silently mislabeling.
- R13. Keyboard semantics: the toggle is keyboard-accessible; Escape cancels the confirm state and returns focus to the (now-restored) Delete button; focus moves to the Confirm button when toggling into the confirm state.

### Tests

- R14. `apps/hub/tests/admin/parts.test.ts` adds a `describe('deletePart')` block with cases: auth header attached, URL composition with `encodeURIComponent`, 204 success resolves void, 404 maps to `PartsFetchError(status: 404)`, 403 propagates `{error: 'Admin authentication required'}` body.
- R15. The same file adds a `describe('deletePartAction')` block with cases: success returns `{ok: true, redirectTo: '/admin/inventory?deleted=<sku>'}` and calls `revalidatePath('/admin/inventory')` exactly once; 403 propagates `error`; 404 propagates `error`; network error.
- R16. `apps/php-api/tests/Feature/PartApiTest.php` adds `test_destroy_*` cases: missing `X-Admin-Token` 403, unset `ADMIN_TOKEN` fail-closed 403, valid token 204 with `assertDatabaseMissing`, missing SKU 404.

## Key Technical Decisions

- KTD-1. Inline two-step confirmation in the same row. Click Delete → button toggles to "Cancel" and a filled-destructive "Confirm Delete" appears. This matches the user's stated intent and keeps the destructive action visible without leaving the page. Alternatives considered: browser-native `confirm()` (rejected: jarring modal); separate confirmation page (rejected: extra navigation for a single destructive action).
- KTD-2. Destructive button styling — outline + destructive color token, not filled. The existing destructive precedents in the repo are inline error pills (`border border-destructive/30 bg-destructive/5 text-destructive` in `PartForm.tsx:296` and `SignInForm.tsx`); the Delete button mirrors that shape but with a button affordance. A filled destructive variant would compete with the primary Save button and break the form's visual hierarchy.
- KTD-3. `204 No Content` on success. Idiomatic REST for DELETE; the hub fetcher resolves on 2xx without parsing a body. Returning `200` with the deleted part would require an unnecessary serialization round-trip.
- KTD-4. CORS `DELETE` method added to `allowed_methods`. Without this, the browser blocks the request at the preflight stage; DevTools shows a CORS error referencing `Access-Control-Allow-Methods` and never issues the DELETE because `X-Admin-Token` is a custom header that triggers a preflight.
- KTD-5. `deletePartAction` is a separate action, not a `mode: 'delete'` extension of `submitPartAction`. DELETE has no FormData to validate, so the Zod path and `fieldErrors` shape do not apply. A separate action keeps the return shape minimal (`{ok: true, redirectTo} | {ok: false, error}`) and the client component owns its own dispatcher.
- KTD-6. `revalidatePath('/admin/inventory')` only. The deleted part's edit path no longer exists, but Next.js renders the existing `not-found.tsx` correctly without an explicit revalidation — only the list view needs cache invalidation.
- KTD-7. Client wraps the action in a `<form action={boundAction}>` with `useFormStatus`, consistent with `apps/hub/src/components/admin/SignOutButton.tsx`. The action is bound via `.bind(null, partNumber, token)`; the form has no inputs.

## Implementation Units

### U1. PHP API endpoint

- **Goal:** Ship `DELETE /api/parts/{part}` to the PHP API, gated by the existing admin-token check, returning 204 on success and 404 for missing parts. CORS allows the method.
- **Files:**
  - `apps/php-api/app/Http/Controllers/PartController.php`
  - `apps/php-api/routes/api.php`
  - `apps/php-api/config/cors.php`
  - `apps/php-api/tests/Feature/PartApiTest.php`
- **Patterns:** Mirror `store()` (lines 60–78) and `update()` (lines 80–102) exactly — same `adminTokenIsValid` call, same 403 body shape, no new helper. The new `destroy()` adds: gate check → `$part->delete()` → `response()->noContent()`.
- **Test scenarios:**
  - DELETE without `X-Admin-Token` header returns 403 with body `{error: 'Admin authentication required'}`
  - DELETE with `putenv('ADMIN_TOKEN')` cleared returns 403 fail-closed even with header
  - DELETE with valid token returns 204 and `assertDatabaseMissing('parts', ['part_number' => $sku])`
  - DELETE on missing SKU returns 404 via `firstOrFail`
  - OPTIONS preflight with `Access-Control-Request-Method: DELETE` returns 200 with `Access-Control-Allow-Methods` listing DELETE
- **Verification:** `cd apps/php-api && ADMIN_TOKEN=test-secret vendor/bin/phpunit` exits 0 with the new test count (baseline 11 → 16).
- **Execution note:** Test-first — write the failing `test_destroy_*` cases before implementing `destroy()`.

### U2. Hub data layer

- **Goal:** Ship `deletePart` fetcher and `deletePartAction` server action in the hub, mirroring the `getPart` and `submitPartAction` patterns.
- **Files:**
  - `apps/hub/src/lib/parts.ts`
  - `apps/hub/src/lib/parts-actions.ts`
  - `apps/hub/tests/admin/parts.test.ts`
- **Patterns:** `deletePart` mirrors `getPart` (lines 161–186) for URL encoding, AbortError mapping, 404 short-circuit; replaces `method: 'GET'` with `method: 'DELETE'` and skips body parsing on 2xx. `deletePartAction` mirrors the success path of `submitPartAction` (revalidatePath, redirectTo) without Zod parsing; imports `deletePart` and `PartsFetchError` from `./parts`.
- **Test scenarios:**
  - `deletePart` attaches `X-Admin-Token: <token>` and DELETEs `/api/parts/<encoded part_number>`; resolves void on 204
  - `deletePart` throws `PartsFetchError(status: 404, body: {error: 'PHP API returned 404'})` on 404
  - `deletePart` propagates `{error: 'Admin authentication required'}` body on 403
  - `deletePart` maps AbortError to `{status: 0, body: {error: 'Request timeout'}}`
  - `deletePart` maps `TypeError` to `{status: 0, body: {error: 'Network error'}}`
  - `deletePartAction` success returns `{ok: true, redirectTo: '/admin/inventory?deleted=PHP-001'}` and calls `revalidatePath('/admin/inventory')` exactly once
  - `deletePartAction` 403 returns `{ok: false, fieldErrors: {}, error: 'Admin authentication required'}`
  - `deletePartAction` 404 returns `{ok: false, fieldErrors: {}, error: 'Part PHP-001 not found'}`
  - `deletePartAction` network error returns `{ok: false, fieldErrors: {}, error: 'Network error'}`
- **Verification:** `cd apps/hub && pnpm test` exits 0 with the new test count (baseline 70 → 79). `pnpm lint` exits 0.
- **Execution note:** Test-first — write failing tests before implementing `deletePart` and `deletePartAction`.

### U3. Hub UI

- **Goal:** Render the Delete button on the edit page with inline two-step confirmation, and add the `?deleted=<sku>` success banner to the inventory list.
- **Files:**
  - `apps/hub/src/components/admin/PartForm.tsx`
  - `apps/hub/src/app/admin/inventory/page.tsx`
- **Patterns:** Wrap `deletePartAction.bind(null, partNumber, token)` in a sibling `<form action={bound}>` next to the existing form. Use `useFormStatus` for pending state. Use `useTransition` for the action result → `router.push` + `router.refresh`. Extend the existing `SuccessBanner` `kind` union (`'created' | 'updated'` → `'created' | 'updated' | 'deleted'`) and verb mapping in `apps/hub/src/app/admin/inventory/page.tsx:64-82`.
- **Test scenarios:** UI components are not currently unit-tested in this repo. Manual verification via `pnpm dev` covers the integration: sign in, edit a part, click Delete → see confirm row → click Cancel → reverts; click Delete → click Confirm Delete → land on inventory list with success banner. With admin token cleared: see top-level destructive-bordered error pill.
- **Verification:** `cd apps/hub && pnpm lint && pnpm build` exit 0. `pnpm dev` smoke test passes the flow above.
- **Execution note:** Pragmatic — the UI is recruiter-demo surface, not test-covered; visual verification in `pnpm dev` is the deliverable. Do not introduce a component-testing framework for this one button.

## Scope Boundaries

### Out of scope (this plan)

- Soft delete, audit log, undo
- Bulk delete
- Delete from inventory list (only edit page per user's stated placement)
- Toast notification system
- Confirmation modal/dialog as separate component
- Inline error UI for the edit-page race condition where a stale tab tries to save a deleted part (existing 404 path already surfaces as form-level alert)

### Deferred for later

- Recruiter-demo narration: README "How to demo" section (handle in a follow-up plan)
- TypeDoc/JSDoc for `deletePartAction` (consistent with the under-documented `submitPartAction`)
- Creating `docs/solutions/` and capturing the admin-token-on-DELETE pattern and the inline two-step confirmation pattern as the first institutional learnings (a long-standing deferred item from plans 002 and 003)

## System-Wide Impact

- **Auth boundary:** No change. Reuses `PartController::adminTokenIsValid` exactly. The fail-closed posture (admin-token unset → all DELETEs rejected) carries over from store/update.
- **CORS:** Single-line addition to `allowed_methods`. No effect on GET/POST/PATCH.
- **Cache invalidation:** `revalidatePath('/admin/inventory')` matches the existing pattern. The deleted SKU's edit path is implicitly not-found on next request via `not-found.tsx`.
- **Production posture:** `apps/php-api/render.yaml` intentionally does not set `ADMIN_TOKEN`; DELETE inherits the fail-closed behavior. No production env change.
- **Test counts:** Hub +9 (79 total, was 70); PHP API +5 (16 total, was 11).

## Risks & Dependencies

- **CORS not updated → browser preflight fails → DELETE blocked.** Mitigated by U1 including the `config/cors.php` change in the same commit. Local Laravel needs `php artisan config:clear` after the config change to pick it up.
- **Two-tab race:** User opens edit page in tab A, deletes the part from tab B (or a future list-page delete), then submits the form in tab A → PATCH 404. Pre-existing race; not introduced by this change. Out of scope.
- **No `docs/solutions/` directory:** Institutional learnings cannot be captured for this codebase until that directory is created (plan 002 → deferred). After this plan ships, the admin-token-on-DELETE pattern and the inline two-step confirmation pattern are good candidates for the first entries.
- **Route-model binding on missing SKU:** Laravel's `firstOrFail` throws `ModelNotFoundException`. The bootstrap exception handler (`apps/php-api/bootstrap/app.php`) must keep `shouldRenderJsonWhen($request->is('api/*'))` enabled so DELETE returns 404 JSON, not HTML.
- **No rate limiting on DELETE:** The PHP API does not rate-limit `DELETE /api/parts/{part}`. An attacker who obtains the admin token (e.g., a leaked cookie, an XSS in another app on the same origin) could rapidly delete all parts. Mitigations today: the admin token is the only gate (`X-Admin-Token` check), production leaves `ADMIN_TOKEN` unset for fail-closed, and the hub gates the admin UI behind a per-page cookie check (`apps/hub/src/lib/admin-token.ts`). Adding rate limiting (e.g., Laravel's `ThrottleRequests` middleware at 30 req/min per token) is a reasonable follow-up but is **out of scope for this plan** — the recruiter-demo scope is one DELETE per intentional action, not bulk. Flagged for `docs/solutions/` institutional tracking once that directory exists.

## Acceptance Examples

- **AE1.** Admin opens edit page for SKU `PHP-001`. Save Changes on the left, Delete on the right (`justify-between` row). Click Delete → Save row unchanged, Delete becomes "Cancel" (outline), "Confirm Delete" (filled-destructive) appears to its left. No API call yet.
- **AE2.** Admin clicks Cancel → row reverts to Save Changes + Delete. No fetch issued.
- **AE3.** Admin clicks Confirm Delete → both buttons disable with `aria-busy="true"`. `DELETE /api/parts/PHP%2F001` returns 204. `router.push('/admin/inventory?deleted=PHP%2F001')` followed by `router.refresh()`. Inventory page renders the green "Part PHP/001 deleted." banner with the `CheckCircle2` icon.
- **AE4.** Admin token missing (cookie cleared) → `deletePartAction` rejects with `PartsFetchError(status: 403, body: {error: 'Admin authentication required'})`. Form-level alert renders in the destructive-bordered pill above the form. Buttons re-enable.
- **AE5.** Part deleted concurrently → 404 → form-level alert "Part PHP-001 not found" → user clicks browser back.
- **AE6.** Network error (PHP API down) → "Network error" alert → buttons re-enable.

## Sources / Research

- **Code references:**
  - `apps/hub/src/lib/parts.ts:1, 71-81, 102-125, 140-159, 161-186, 188-208, 210-237, 246-259, 261-282` — server-only boundary, `PartsFetchError` shape, `parseErrorBody`, `request()` wrapper, `listParts`, `getPart` to mirror, `createPart`, `updatePart` body-shape pattern, `formDataToCreateInput`, `formDataToUpdateInput`.
  - `apps/hub/src/lib/parts-actions.ts:1, 21-79, 81-98` — file-top `'use server'`, redirect pattern, `fetchErrorToState`, `issuesToFieldErrors`.
  - `apps/hub/src/components/admin/PartForm.tsx:1-308` — form layout, SubmitButton styling, `useActionState` pattern, existing destructive error pill at line 296.
  - `apps/hub/src/components/admin/SignOutButton.tsx` — `<form action={bound}>` + `useFormStatus` pattern to mirror.
  - `apps/hub/src/app/admin/inventory/page.tsx:10, 30, 52-57, 64-82` — `searchParams` parsing, `SuccessBanner` `kind` union and verb mapping to extend.
  - `apps/hub/src/app/globals.css:31-32` — `--destructive` color tokens.
  - `apps/hub/src/lib/admin-token.ts:9, 12` — cookie name and path (`/admin`) — confirms per-page gate, no middleware needed.
  - `apps/php-api/app/Http/Controllers/PartController.php:60-119` — `store()`, `update()`, `adminTokenIsValid()` to mirror.
  - `apps/php-api/routes/api.php:13-16` — current routes (GET/POST/PATCH/PUT on `/api/parts`).
  - `apps/php-api/config/cors.php:21, 27` — `allowed_methods` (DELETE missing) and `allowed_headers` (X-Admin-Token already present).
  - `apps/php-api/bootstrap/app.php:19` — `Route::bind('part', ...)` by `part_number`; exception handler renders JSON for `api/*`.
  - `apps/php-api/tests/Feature/PartApiTest.php` — existing test style (PHPUnit 11, `RefreshDatabase`, `getJson`/`assertStatus`/`assertDatabaseHas|Missing`).
- **Prior plans:**
  - `docs/plans/2026-09-04-002-feat-admin-inventory-ui-plan.md` — deferred delete bullet (origin of this plan).
  - `docs/plans/2026-09-04-003-fix-hub-server-action-extraction-plan.md` — file-top `'use server'` placement rule; client components must import server actions from `@/lib/parts-actions`, not `@/lib/parts`.
  - `docs/plans/2026-09-04-004-fix-hub-php-api-admin-token-drift-plan.md` — `parseErrorBody` propagation of upstream `{error: 'Admin authentication required'}` body.
- **No institutional learnings:** `docs/solutions/` does not exist in this repo. All patterns above are derived from the shipped code and prior plans.

## Deferred / Open Questions

### From 2026-09-05 review

- **KTD-2 vs R10 destructive styling contradiction** — Requirements R10 / Key Technical Decisions KTD-2 (P1, ce-design-lens-reviewer, confidence 100)

  R10 says the "Confirm Delete" button is "filled destructive." KTD-2 says the destructive button must be "outline + destructive color token, not filled" — explicitly arguing that a filled destructive variant would compete with the primary Save button and break visual hierarchy. The two statements are in direct conflict, and the conflict is unresolvable from inside the doc. An implementer following R10 violates KTD-2; an implementer following KTD-2 violates R10.

- **Delete error display location** — Requirements R11 / U3 Patterns (P1, ce-design-lens-reviewer, confidence 75)

  With R9's sibling-form restructure, the Delete form and the edit form are separate `<form>` roots — they cannot share React state via `useActionState`. R11 currently says errors "surface in the existing top-level `state.error` alert," but that alert is owned by the edit form's `useActionState`. The implementer must decide: (a) the Delete form owns its own inline alert (parallel to the edit form's alert, rendered above the actions row); (b) lift error state into a parent component that wraps both forms and routes the Delete error into the same alert; (c) use a portal to render the Delete error in the parent's alert location. Option (a) is the simplest and is implicit in the restructured R11; the user should confirm before U3 implementation.

- **`deletePartAction` token source** — Hub data layer R7 (P1, ce-security-lens-reviewer, confidence 75)

  R7 says `deletePartAction(partNumber, token)` — the token is caller-supplied. `submitPartAction` follows the same shape and the client reads the token from the `hvac_admin_token` cookie at call time, so the token already lives in the client bundle. The security concern is that caller-supplied token perpetuates the pattern where the admin token is client-visible. A stronger pattern is to have the server action read the cookie directly via `cookies()` from `next/headers` and never accept the token as a parameter — but this is a refactor that should happen to both `submitPartAction` and `deletePartAction` together (or neither), and it's outside the scope of this plan. Flag for the implementer: the current R7 shape is consistent with the existing pattern, and changing it would touch unrelated code.

- **CORS `allowed_origins` default verification** — Key Technical Decisions KTD-4 (P1, ce-security-lens-reviewer, confidence 75)

  KTD-4 adds `DELETE` to `allowed_methods` but does not address `allowed_origins`. `apps/php-api/.env.example` shows `CORS_ALLOWED_ORIGINS=` empty by default, and the `spatie/laravel-cors` config defaults `allowed_origins` to `['*']` (wildcard) when unset. In production this means any origin can issue DELETEs as long as it has a valid admin token. The implementer should verify the actual default at U1 implementation and either: (a) confirm production sets `CORS_ALLOWED_ORIGINS` to the hub's Vercel URL explicitly, or (b) document this as an accepted risk for the recruiter-demo scope (the admin token check is still the primary gate).
