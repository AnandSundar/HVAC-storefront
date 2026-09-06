<?php

/*
 * Cross-Origin Resource Sharing (CORS) configuration.
 *
 * Behavior:
 *   - Dev (default): `allowed_origins => ['*']` allows any origin.
 *   - Prod: set `CORS_ALLOWED_ORIGINS` to a comma-separated list of
 *     allowed origins (e.g. `https://hub.example.com,https://store.example.com`).
 *     Empty env var falls back to `['*']` for dev parity.
 */

$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

/*
 * Production guard: wildcard origin (`*`) and empty origin lists are security
 * risks in production. Mirrors the fail-closed posture in:
 *   - apps/hub/src/lib/parts.ts (`getApiUrl` https-only check)
 *   - PartController::adminTokenIsValid (admin token rejection on misconfig)
 *
 * Dev defaults to `['*']` for friction-free local development. Prod fails fast
 * at config-load time so a misconfigured deploy surfaces in the Render build
 * logs rather than as a silent CORS bypass at runtime. If you see this error
 * in production, set `CORS_ALLOWED_ORIGINS` to a comma-separated list of
 * canonical origins in your deployment dashboard (e.g.
 * `https://hvac-fullstack-portfolio-hub.vercel.app,https://store.example.com`).
 */
if (env('APP_ENV') === 'production' && ($allowedOrigins === [] || $allowedOrigins === ['*'])) {
    throw new \RuntimeException(
        'CORS_ALLOWED_ORIGINS must be set to a comma-separated list of allowed origins in production. '
        . 'Wildcard (`*`) and empty values are not permitted. '
        . 'Set this env var in your Render / Vercel dashboard to the canonical origin(s) of your hub.'
    );
}

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins === [] ? ['*'] : $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Admin-Token', 'Authorization', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
