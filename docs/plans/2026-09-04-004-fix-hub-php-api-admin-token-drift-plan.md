---
title: fix — align hub + PHP API admin token and propagate upstream JSON error messages
date: 2026-09-04
type: fix
status: planned
origin: docs/plans/2026-09-04-002-feat-admin-inventory-ui-plan.md
---

# Plan — Align Admin Token + Propagate Upstream Error Message

## Summary

The hub admin UI's create/edit forms return `{ok: false, error: "Forbidden"}` because `apps/php-api/.env` sets `ADMIN_TOKEN=test123` while the hub sends `X-Admin-Token: test-secret` from the cookie. The two values drifted; the hub now fails every POST/PATCH against a live PHP API even though the cookie roundtrip works.

A second, smaller bug compounds the symptom: `parseErrorBody` in `apps/hub/src/lib/parts.ts` overwrites any upstream JSON `error` field with `res.statusText`, so even when the upstream sends the actionable "Admin authentication required" message, the user sees only "Forbidden". The fix preserves the JSON body whenever it carries an `error` string.

Two small units: align the env values, propagate the upstream message. No new dependencies, no architectural changes.

## Problem Frame

A recruiter signs in at `/admin/sign-in` with the demo token (`test-secret`), lands on `/admin/inventory`, clicks "New part", fills the form, and submits. The server action issues `POST http://localhost:8000/api/parts` with `X-Admin-Token: test-secret`. PHP API's `PartController::adminTokenIsValid` compares against `env('ADMIN_TOKEN') === 'test123'`, the comparison fails, and the controller returns `403 {"error":"Admin authentication required"}`. The hub's `parseErrorBody` discards the JSON `error` and substitutes `res.statusText`, so the user sees `Forbidden` — and there is no path from that message back to the real cause without reading source code.

The `.env.example` files disagree on the canonical token. `apps/hub/.env.example` documents `HUB_ADMIN_TOKEN=test-secret`. `apps/php-api/.env.example` documents `ADMIN_TOKEN=` (empty, for fail-closed production). The local `apps/php-api/.env` override (`test123`) was never reconciled with the hub's documented default. The two-sided contract has no place that asserts the values match.

## Requirements

| ID | Requirement |
|---|---|
| R1 | Submitting `/admin/inventory/new` with valid form data against a running PHP API creates the part and returns `{ ok: true, redirectTo }`. |
| R2 | A non-JSON 403 (e.g., a reverse-proxy HTML error page) still surfaces the upstream `statusText` as a fallback, so the user is never stuck on a silent failure. |
| R3 | A JSON 403 (or any non-422 non-2xx with `{ "error": "..." }` body) surfaces that `error` string verbatim — not the HTTP statusText. |
| R4 | `apps/php-api/.env.example` documents `ADMIN_TOKEN=test-secret` so a fresh clone sets up a matching dev token. |
| R5 | `pnpm turbo run test --filter=hub` stays green; the new test for the propagated message runs. |
| R6 | No `🤖 Generated with [Claude Code]` footer in the commit body (memory rule). |
| R7 | Commit only files in U1–U2's `Files:` lists (memory rule). |

## Key Technical Decisions

### KTD-1 — `test-secret` is the canonical dev token; align PHP API's `.env` to it

The hub's `.env.example` is the source of truth for the demo token (recruiter signs in with `test-secret`, documented in plan 002). PHP API's local `.env` is misconfigured. We align PHP API to `test-secret`, not the other direction, because changing the hub token would force README, plan 002, and any local clones to be edited in lockstep.

PHP API's `.env.example` intentionally leaves `ADMIN_TOKEN=` empty for fail-closed production posture (no dev default in the example). This plan **does not change** that — the example stays empty so production deploys default to reject-all. We just update the comment block on `ADMIN_TOKEN` in `.env.example` to point to the matching dev value `test-secret` and note that this is the value the hub expects.

### KTD-2 — Propagate the upstream JSON `error` field on every non-2xx, not just 422

`parseErrorBody` currently special-cases 422 to extract the `errors` map and falls back to `statusText` for everything else. The fix: after the 422 branch, if the parsed JSON is an object with a string `error` field, return `{ error: <that string> }`. Only fall back to `statusText` when (a) the body is not JSON, or (b) the JSON has no `error` field. Sanitization rules from KTD-9 of plan 002 still apply — we still drop `exception`, `file`, `trace`, and other Laravel debug keys; we just no longer drop the upstream's own `error` message in favor of the generic statusText.

### KTD-3 — No new test for the env alignment; the unit tests catch the code fix

A literal `.env` drift is an operational concern, not a code concern. We document the alignment in the PHP API's `.env.example` and add a one-line note in the hub's README in U1; we do not add a startup check (user rejected that option). The only new test is in U2, asserting `parseErrorBody` keeps the upstream `error` field.

## Implementation Units

### U1. Align PHP API admin token to hub's canonical value

**Goal:** Stop the 403 caused by `apps/php-api/.env` having `ADMIN_TOKEN=test123` while the hub sends `test-secret`. Document the value in `.env.example`.

**Files:**
- `apps/php-api/.env` (MODIFIED). Line 47 `ADMIN_TOKEN=test123` → `ADMIN_TOKEN=test-secret`.
- `apps/php-api/.env.example` (MODIFIED). The `ADMIN_TOKEN=` block (lines 43–47) gains a comment line documenting that the local-dev override should be `ADMIN_TOKEN=test-secret` to match the hub's `HUB_ADMIN_TOKEN` default. The example file itself keeps `ADMIN_TOKEN=` empty so production deploys still fail closed.
- `README.md` (MODIFIED). The `## Quick start` section (root README, around line 81) gains one bullet: "`apps/php-api/.env` must set `ADMIN_TOKEN=test-secret` to match the hub's default; otherwise `POST /api/parts` returns 403 from inside the admin UI."

**Approach:**
- `.env` is a local file (not committed in this monorepo per `.gitignore`). Editing it changes the running PHP API's behavior immediately — no service restart needed because `env()` is read per-request. Verify by re-running the user's curl from the plan description; the response body should now be `{ok:true, redirectTo:'/admin/inventory?created=...'}`.
- `.env.example` change: insert one comment line directly above the existing empty `ADMIN_TOKEN=` line. Example content:
  ```
  # Admin token required for POST/PATCH /api/parts/{part}.
  # Leave UNSET in production for fail-closed behavior (all writes rejected).
  # When set, requests must include matching `X-Admin-Token` header.
  # For local dev, set to "test-secret" to match apps/hub's HUB_ADMIN_TOKEN default.
  ADMIN_TOKEN=
  ```
- `README.md` edit is a single bullet addition. Cite the consequence ("403 from inside the admin UI") so the next dev reading the README understands why the line matters.

**Test scenarios:**
- *File shape:* `apps/php-api/.env` line 47 reads `ADMIN_TOKEN=test-secret`.
- *Docs shape:* `apps/php-api/.env.example` contains the comment `set to "test-secret"` near the `ADMIN_TOKEN=` line; the `ADMIN_TOKEN=` value itself stays empty.
- *README shape:* the `## Quick start` section contains the word `test-secret` and references the admin UI.

**Verification:** re-run the curl from this plan's origin (the recruiter's sign-in → POST flow) and confirm the response is `{ok:true, redirectTo:'/admin/inventory?created=...'}`, not `{ok:false, error:'Forbidden'}`.

### U2. Propagate upstream JSON `error` field in `parseErrorBody`

**Goal:** A non-422 non-2xx response that carries a JSON `{ "error": "..." }` body surfaces that message verbatim. StatusText remains the fallback only when the body has no `error` field or is not JSON.

**Files:**
- `apps/hub/src/lib/parts.ts` (MODIFIED). `parseErrorBody` (currently lines 101–116): after the 422 branch, add a non-422 branch that checks for an object with a string `error` field and returns `{ error: <that string> }`. Keep the existing `statusText` fallback for the catch (non-JSON body) path.
- `apps/hub/tests/admin/parts.test.ts` (MODIFIED). Add two tests inside the `describe('listParts', ...)` block:
  1. *JSON 403 propagates `error`:* mocked `fetch` returns 403 with body `{ "error": "Admin authentication required" }`. `await listParts(ADMIN_TOKEN)` rejects with a `PartsFetchError` whose `body` deep-equals `{ error: 'Admin authentication required' }` — not `{ error: 'Forbidden' }`.
  2. *Non-JSON 403 falls back to statusText:* mocked `fetch` returns 403 with `Content-Type: text/html` and an HTML body. The thrown error's `body` is `{ error: 'Forbidden' }` (the statusText). Use `new Response('<html>...</html>', { status: 403, statusText: 'Forbidden', headers: { 'Content-Type': 'text/html' } })` so `res.json()` throws.

**Approach:**
- Pseudo-sketch for the new branch (not implementation spec — direction only):
  ```
  if status != 422:
      if raw is object and typeof raw.error is 'string':
          return { error: raw.error }
  return { error: res.statusText || 'Request failed' }
  ```
  The first two checks preserve sanitization — `exception`, `file`, `trace` are still dropped because we never copy them. The third return is the existing statusText fallback.
- The two new tests follow the existing `vi.stubGlobal('fetch', ...)` + `jsonResponse` helper pattern. The non-JSON test needs a different helper because `jsonResponse` always sets `Content-Type: application/json`; either inline-construct the `Response` or add a small `textResponse` helper. Inline construction is fine — it's one test.
- Don't broaden the sanitization contract in this unit. KTD-2 of plan 002 (drop `message`, `exception`, `file`, `trace`) still applies. This unit changes only which field is selected as the user-visible `error`, not what fields are kept.

**Test scenarios:**
- *JSON 403:* as above; body equals `{ error: 'Admin authentication required' }`.
- *Non-JSON 403:* as above; body equals `{ error: 'Forbidden' }` (statusText preserved as fallback).
- *Existing 422 tests:* still pass — the new branch only fires when status != 422 and the JSON has `error`.
- *Existing non-422 non-2xx tests (500, network, timeout):* still pass — a 500 with body `{ exception: '...' }` (no `error` field) still falls through to statusText; a network failure still throws before `parseErrorBody` is reached.

**Verification:** `pnpm turbo run test --filter=hub` reports 70/70 passing (68 baseline + 2 new). `pnpm turbo run typecheck --filter=hub` clean. `pnpm turbo run lint --filter=hub` clean.

---

## Verification

End-to-end after both units land:

1. `apps/php-api/.env` reads `ADMIN_TOKEN=test-secret`.
2a. In terminal A: `pnpm turbo run dev` (boots hub on `:3000`, plus storefront and Node API — turbo only orchestrates workspaces with a `package.json`, and `apps/php-api/` has none, so the PHP API is NOT started by turbo).
2b. In terminal B: `cd apps/php-api && php artisan serve` (boots PHP API on `:8000`, matching `PHP_API_URL` and `APP_URL`).
3. `curl -sI http://localhost:3000/admin/inventory` is reachable.
4. Sign in at `/admin/sign-in` with `test-secret`. Land on `/admin/inventory` (seeded parts visible).
5. Click "New part", fill `part_number=PHP-DEMO-1`, `name=Demo`, `description=Created during smoke`, `unit_cost=10`, `inventory_qty=5`, `category=Filters`, `manufacturer=Acme`. Submit.
6. Expect redirect to `/admin/inventory?created=PHP-DEMO-1` with a success banner and the new row in the table.
7. If PHP API is misconfigured (e.g., a dev temporarily sets `ADMIN_TOKEN=wrong`), expect the form to render `{ error: 'Admin authentication required' }` (U2 propagation) instead of `{ error: 'Forbidden' }` (U2 statusText fallback).
8. `pnpm turbo run test typecheck lint --filter=hub` green; `php artisan test` in `apps/php-api` still 11/11 green (no PHP changes).
9. Commit message contains no Claude Code footer. Commit scope contains only files in U1–U2's `Files:` lists.

## Out of scope

- Startup token-match check (turbo `predev` task or `scripts/check-tokens.mjs`). User explicitly rejected in favor of the tight fix.
- HUB_DEMO_MODE flag for offline demos. User explicitly rejected.
- Broader error-body sanitization for non-error Laravel fields. Out of scope per KTD-3.
- Any change to the PHP API's auth check, controller, or middleware.
