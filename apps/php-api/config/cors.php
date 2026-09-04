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

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins === [] ? ['*'] : $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Admin-Token', 'Authorization', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
