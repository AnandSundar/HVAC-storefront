---
name: admin-token-fail-closed
description: How to gate admin-only Laravel endpoints with a shared-token check that fails closed when misconfigured, plus the ORDER MATTERS invariant that protects the row on the 403 path.
type: pattern
tags: [auth, php, laravel, security, fail-closed, mock-auth]
related_code:
  - apps/php-api/app/Http/Controllers/PartController.php
  - apps/php-api/tests/Feature/PartApiTest.php
  - apps/hub/src/lib/parts.ts
  - apps/hub/src/lib/parts-actions.ts
  - apps/hub/src/middleware.ts
---

# Admin token: fail-closed pattern

## Problem

The PHP API is a portfolio demo — there is no real authentication, no user
accounts, no session. But three endpoints (`POST /api/parts`, `PATCH
/api/parts/{part}`, `DELETE /api/parts/{part}`) need to be admin-only. The
caller is the hub admin UI, which already knows a shared `ADMIN_TOKEN` from
the deployment env.

We need a check that:

1. **Fails closed on misconfiguration.** If `ADMIN_TOKEN` is unset, even a
   header containing a correct guess must be rejected — otherwise an
   operator who forgot to set the env var exposes every admin endpoint.
2. **Uses timing-safe comparison.** String `===` leaks the matching prefix
   length via response timing, which an attacker can iterate.
3. **Is co-located with the endpoint.** A middleware would be cleaner for
   production auth, but the rule "ADMIN_TOKEN unset ⇒ all POSTs rejected"
   is easier to verify when it lives next to the single endpoint that needs
   it.
4. **Orders the check before the mutation.** A 403 must never delete the
   row. This sounds obvious until you re-arrange the method body and
   accidentally put the gate after `$part->delete()`.

## Solution

A private method on the controller:

```php
private function adminTokenIsValid(Request $request): bool
{
    $expected = env('ADMIN_TOKEN');

    // (1) Fail closed: unset env rejects every header value.
    if (! is_string($expected) || $expected === '') {
        return false;
    }

    $provided = $request->header('X-Admin-Token');

    if (! is_string($provided) || $provided === '') {
        return false;
    }

    // (2) Timing-safe compare via hash_equals.
    return hash_equals($expected, $provided);
}
```

Every admin-only endpoint calls this method first and returns 403 on `false`:

```php
public function destroy(Request $request, Part $part): Response
{
    // ORDER MATTERS: the admin-token gate MUST run before $part->delete().
    if (! $this->adminTokenIsValid($request)) {
        return response()->json(['error' => 'Admin authentication required'], 403);
    }

    $part->delete();

    return response()->noContent();
}
```

The hub side sends the token as `X-Admin-Token` in `buildHeaders(token)`
and the failure mode is surfaced verbatim to the user via
`parseErrorBody` → `err.body.error`.

## Key invariants

- **ORDER MATTERS.** The gate runs before `$part->delete()` (or `update()`
  or `create()`). Re-ordering this breaks the fail-closed property; the
  test `test_destroy_without_admin_token_returns_403` enforces it via
  `assertDatabaseHas` on the 403 path.
- **Fail closed on env unset.** `adminTokenIsValid` returns `false` when
  `env('ADMIN_TOKEN')` is unset or empty — even if the header carries a
  non-empty value. Test: `test_destroy_with_unset_admin_token_rejects_even_correct_guess`.
- **Timing-safe compare.** `hash_equals`, never `===`. Always.
- **All three env sources must be cleared in tests.** PHPUnit's `<env>`
  directive populates `$_SERVER`; `env()` reads putenv, `$_ENV`, and
  `$_SERVER`. Clearing only `putenv('ADMIN_TOKEN')` leaves the value in
  `$_SERVER` and the test passes by accident. The pattern is documented in
  the existing test comment.

## Trade-offs

- **Inline check, not middleware.** Repeated in `store`, `update`, and
  `destroy`. The alternative (a middleware group) would centralize the rule
  but couples the endpoint definition to the middleware name, which is
  harder to grep for. For three endpoints, the duplication cost is fine.
- **No rate limiting.** A demo with a public `X-Admin-Token` header has no
  protection against brute-force. The fail-closed-on-misconfig posture is
  the only line of defense. In production, replace with real auth + rate
  limit; this pattern does not scale.
- **`env()` outside config files.** Reading `env()` from a controller is a
  Laravel anti-pattern (config caching breaks it), but for this single
  shared secret it is intentional — the secret must NOT be cached.

## Related

- Origin plan: [`docs/plans/2026-09-05-001-feat-admin-delete-part-plan.md`](../plans/2026-09-05-001-feat-admin-delete-part-plan.md) — introduced the
  delete endpoint with this same gate.
- **CORS guard**: `apps/php-api/config/cors.php` applies the same fail-closed
  posture to `CORS_ALLOWED_ORIGINS` — a wildcard or empty origin list throws
  at config-load time when `APP_ENV=production`. See the `apps/php-api/tests/Feature/CorsConfigTest.php`
  coverage for the parallel pattern.
- Mirror on the hub side: `apps/hub/src/lib/parts.ts#getApiUrl` rejects
  non-https `PHP_API_URL` in production for the same reason.
