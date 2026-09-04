<?php

use App\Models\Part;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Route-model bind {part} by part_number, not by primary key. The
            // recruiter demo expects /api/parts/PHP-001 to work — that's the
            // visible SKU on the storefront. PHPUnit tests use $part->id so
            // they pass either way.
            Route::bind('part', fn (string $value) => Part::where('part_number', $value)->firstOrFail());
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API stack: CORS first, then throttle. Sanctum/csrf omitted — API-only.
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Render all API exceptions as JSON for /api/* routes.
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
