<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Validates the production guard in `config/cors.php`.
 *
 * The guard fails fast at config-load time when `APP_ENV=production` and
 * `CORS_ALLOWED_ORIGINS` is empty or wildcard. Mirrors the fail-closed
 * posture in `apps/hub/src/lib/parts.ts` (`getApiUrl` https-only check) and
 * `PartController::adminTokenIsValid` (admin-token rejection on misconfig).
 *
 * Each test re-requires `config/cors.php` so the file's top-level code runs
 * against the env state we set up. Tests restore env state in `finally` so
 * later tests are not affected by side effects.
 */
class CorsConfigTest extends TestCase
{
    /**
     * Production + empty origins → RuntimeException. Wildcard is not an
     * acceptable origin in production because it would allow any cross-origin
     * request to reach the admin-token-gated endpoints.
     */
    public function test_cors_config_in_production_with_empty_origins_throws(): void
    {
        $previousPutenv = getenv('CORS_ALLOWED_ORIGINS');
        $previousEnvVar = $_ENV['CORS_ALLOWED_ORIGINS'] ?? null;
        $previousServer = $_SERVER['CORS_ALLOWED_ORIGINS'] ?? null;

        // Force APP_ENV=production across all env sources (same multi-source
        // clear pattern as the admin-token tests — env() reads from putenv /
        // $_ENV / $_SERVER via the Laravel repository, so any one of them
        // being "production" while we re-require the config is enough).
        $this->setEnv('APP_ENV', 'production');

        // Clear CORS_ALLOWED_ORIGINS across all env sources.
        putenv('CORS_ALLOWED_ORIGINS=');
        unset($_ENV['CORS_ALLOWED_ORIGINS'], $_SERVER['CORS_ALLOWED_ORIGINS']);

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessageMatches('/CORS_ALLOWED_ORIGINS.*production/i');
            require base_path('config/cors.php');
        } finally {
            $this->restoreAppEnv();
            $this->restoreEnv('CORS_ALLOWED_ORIGINS', $previousPutenv, $previousEnvVar, $previousServer);
        }
    }

    /**
     * Explicit `*` in production must also fail — operators sometimes set the
     * env var to a literal star when they don't realize the dev default applies.
     */
    public function test_cors_config_in_production_with_explicit_wildcard_throws(): void
    {
        $previousPutenv = getenv('CORS_ALLOWED_ORIGINS');
        $previousEnvVar = $_ENV['CORS_ALLOWED_ORIGINS'] ?? null;
        $previousServer = $_SERVER['CORS_ALLOWED_ORIGINS'] ?? null;

        $this->setEnv('APP_ENV', 'production');
        putenv('CORS_ALLOWED_ORIGINS=*');
        $_ENV['CORS_ALLOWED_ORIGINS'] = '*';
        $_SERVER['CORS_ALLOWED_ORIGINS'] = '*';

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessageMatches('/CORS_ALLOWED_ORIGINS.*production/i');
            require base_path('config/cors.php');
        } finally {
            $this->restoreAppEnv();
            $this->restoreEnv('CORS_ALLOWED_ORIGINS', $previousPutenv, $previousEnvVar, $previousServer);
        }
    }

    /**
     * Production + explicit origin list → config loads cleanly with the
     * parsed origins. This is the happy path: a real deploy with CORS set.
     */
    public function test_cors_config_in_production_with_explicit_origins_succeeds(): void
    {
        $previousPutenv = getenv('CORS_ALLOWED_ORIGINS');
        $previousEnvVar = $_ENV['CORS_ALLOWED_ORIGINS'] ?? null;
        $previousServer = $_SERVER['CORS_ALLOWED_ORIGINS'] ?? null;

        $this->setEnv('APP_ENV', 'production');
        putenv('CORS_ALLOWED_ORIGINS=https://hub.example.com,https://store.example.com');
        $_ENV['CORS_ALLOWED_ORIGINS'] = 'https://hub.example.com,https://store.example.com';
        $_SERVER['CORS_ALLOWED_ORIGINS'] = 'https://hub.example.com,https://store.example.com';

        try {
            $config = require base_path('config/cors.php');
            $this->assertSame(
                ['https://hub.example.com', 'https://store.example.com'],
                $config['allowed_origins'],
            );
        } finally {
            $this->restoreAppEnv();
            $this->restoreEnv('CORS_ALLOWED_ORIGINS', $previousPutenv, $previousEnvVar, $previousServer);
        }
    }

    /**
     * Dev + empty origins → defaults to wildcard `['*']` for friction-free
     * local development. Guards should only be active in production.
     */
    public function test_cors_config_in_development_with_empty_origins_falls_back_to_wildcard(): void
    {
        $previousPutenv = getenv('CORS_ALLOWED_ORIGINS');
        $previousEnvVar = $_ENV['CORS_ALLOWED_ORIGINS'] ?? null;
        $previousServer = $_SERVER['CORS_ALLOWED_ORIGINS'] ?? null;

        putenv('CORS_ALLOWED_ORIGINS=');
        unset($_ENV['CORS_ALLOWED_ORIGINS'], $_SERVER['CORS_ALLOWED_ORIGINS']);

        try {
            $config = require base_path('config/cors.php');
            $this->assertSame(['*'], $config['allowed_origins']);
        } finally {
            $this->restoreEnv('CORS_ALLOWED_ORIGINS', $previousPutenv, $previousEnvVar, $previousServer);
        }
    }

    /**
     * Restores an env var across putenv / $_ENV / $_SERVER to its pre-test
     * state. Handles the unset case (false from getenv, null from $_ENV array).
     */
    private function restoreEnv(
        string $name,
        string|false $previousPutenv,
        mixed $previousEnvVar,
        mixed $previousServer,
    ): void {
        if ($previousPutenv !== false) {
            putenv("{$name}={$previousPutenv}");
        } else {
            putenv($name);
        }
        if ($previousEnvVar !== null) {
            $_ENV[$name] = $previousEnvVar;
        } else {
            unset($_ENV[$name]);
        }
        if ($previousServer !== null) {
            $_SERVER[$name] = $previousServer;
        } else {
            unset($_SERVER[$name]);
        }
    }

    /**
     * Sets an env var across putenv / $_ENV / $_SERVER so a subsequent call to
     * Laravel's env() helper (which consults all three sources) sees the new
     * value. We write $_SERVER last because Laravel's env() reads it with
     * highest precedence in the repository.
     */
    private function setEnv(string $name, string $value): void
    {
        putenv("{$name}={$value}");
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }

    /**
     * Restores APP_ENV to 'testing' (the phpunit.xml default) across putenv /
     * $_ENV / $_SERVER. Called from the finally block of every test that
     * temporarily forced production.
     */
    private function restoreAppEnv(): void
    {
        $this->setEnv('APP_ENV', 'testing');
    }
}
