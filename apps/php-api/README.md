# PHP API — HVAC Parts Inventory

A standalone Laravel 11 REST API for HVAC parts inventory. Built as part of the
**HVAC Portfolio Monorepo** (U5) to demonstrate PHP / Laravel skills alongside
a separate Node.js GraphQL API.

This API deliberately uses **different field names** and a **subset of categories**
compared to the Node API to illustrate realistic cross-stack integration friction
(KTD-5). A real production deployment would need a translation layer between
the two systems.

## Why a separate PHP API?

This monorepo demonstrates five technology stacks. The Node GraphQL API is the
production deployment; the PHP API exists to:

- Demonstrate Laravel 11 (Eloquent, Form Requests, API Resources, CORS)
- Show how two unrelated inventory systems would integrate in a legacy
  environment (different schema, different conventions)
- Provide a deployable artifact using a different ecosystem (Composer, PSR-4,
  PHP-FPM/Render's Dockerfile path)

## Quick Deploy to Render

Render's free tier allows only **one** live web service per account, which is
used by the Node GraphQL API. The PHP API ships as a one-click deploy button —
click it to spin up your own instance:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/hvac-fullstack-portfolio/tree/main/apps/php-api)

After deployment:

1. Render runs the Dockerfile, generating `APP_KEY` automatically.
2. SQLite database is created on first boot via `php artisan migrate --force`
   (you'll need to run this once via Render's shell, or extend the Dockerfile
   CMD to chain `migrate --force && seed --force`).
3. Set `ADMIN_TOKEN` in the Render dashboard env vars to enable POST `/api/parts`.
   Until set, **every POST is rejected** (fail-closed — see "Admin Auth" below).

## Local Development

### Prerequisites

- PHP 8.2 or higher with extensions: `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `zip`
- Composer 2.x

### Setup

```bash
cd apps/php-api

# Install dependencies
composer install

# Generate APP_KEY
php artisan key:generate

# Create SQLite file + migrate + seed
touch database/database.sqlite
php artisan migrate:fresh --seed

# Boot dev server
php artisan serve --host=127.0.0.1 --port=8000
```

### Verify

```bash
curl http://127.0.0.1:8000/api/parts
curl http://127.0.0.1:8000/api/parts/1
curl 'http://127.0.0.1:8000/api/parts?category=Filters'
curl http://127.0.0.1:8000/up    # health check
```

### Run tests

```bash
ADMIN_TOKEN=test-secret vendor/bin/phpunit
```

PHPUnit reads `ADMIN_TOKEN=test-secret` from `phpunit.xml` automatically.

## API Reference

| Method | Path                | Auth          | Purpose                          |
|--------|---------------------|---------------|----------------------------------|
| GET    | `/api/parts`        | none          | List parts (optional `?category=`, `?per_page=`) |
| GET    | `/api/parts/{id}`   | none          | Single part                      |
| POST   | `/api/parts`        | admin token   | Create part                      |
| PATCH  | `/api/parts/{id}`   | admin token   | Update part                      |
| GET    | `/up`               | none          | Laravel health check             |

### Response shape

```json
{
  "data": {
    "id": 1,
    "part_number": "PHP-001",
    "name": "Filtrete 16x25x1 MERV 12 Pleated Filter (6-pack)",
    "description": "MERV 12 pleated filter, 6-pack.",
    "unit_cost": "89.99",
    "inventory_qty": 150,
    "bin_location": "F-01",
    "category": "Filters",
    "manufacturer": "Filtrete",
    "created_at": "2026-09-04T12:00:00.000000Z",
    "updated_at": "2026-09-04T12:00:00.000000Z"
  }
}
```

### Field naming — different from Node API

| Concept       | Node API | PHP API        |
|---------------|----------|----------------|
| SKU           | `sku`    | `part_number`  |
| Price         | `price`  | `unit_cost`    |
| Stock         | `stock`  | `inventory_qty`|
| Warehouse bin | (n/a)    | `bin_location` |

### Categories — subset of Node API

Node API: `Furnaces, Filters, Thermostats, Motors, Controls, Ductwork`
PHP API:  `Filters, Motors, Controls, Ductwork` (no Furnaces, no Thermostats)

## Admin Auth

`POST /api/parts` and `PATCH /api/parts/{id}` are gated by a mock admin-token
check, implemented **inline in `PartController::store()` and `update()`** (not
middleware) so the rule is co-located with the only endpoints that need it.

- Header: `X-Admin-Token: <value>`
- Token source: `ADMIN_TOKEN` env var

### Fail-closed semantics

```
ADMIN_TOKEN unset        => ALL POSTs/PATCHes return 403
ADMIN_TOKEN='secret'     => POST returns 201 if header matches
ADMIN_TOKEN='secret'     => POST returns 403 if header missing/mismatched
```

The check uses `hash_equals()` for timing-safe comparison. If `ADMIN_TOKEN`
is unset, even a header containing a guess is rejected — prevents accidental
admin access on a misconfigured deploy.

**Why no Laravel Sanctum / Passport?** Real authentication (OAuth, JWT, Sanctum)
is out of scope for the 4-day portfolio window. The mock token check exists
solely to demonstrate the controller → form-request → model write path and
HTTP 403 semantics.

## CORS

`config/cors.php` allows all origins in dev. In production, set
`CORS_ALLOWED_ORIGINS` to a comma-separated list of allowed origins:

```bash
# Allow a single storefront domain
CORS_ALLOWED_ORIGINS=https://store.example.com

# Allow multiple
CORS_ALLOWED_ORIGINS=https://store.example.com,https://hub.example.com
```

## Project Layout

```
apps/php-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/PartController.php    # GET/POST/PATCH /api/parts
│   │   ├── Requests/StorePartRequest.php     # POST validation
│   │   ├── Requests/UpdatePartRequest.php    # PATCH validation
│   │   └── Resources/PartResource.php        # response shaping
│   ├── Models/Part.php                       # Eloquent model
│   └── Providers/AppServiceProvider.php
├── bootstrap/app.php                         # Laravel 11 entry point
├── config/cors.php
├── database/
│   ├── factories/PartFactory.php             # test fixtures
│   ├── migrations/2026_09_04_000001_create_parts_table.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── PartsSeeder.php                   # 20 parts across 4 categories
├── public/index.php                          # HTTP entry
├── routes/api.php
├── tests/Feature/PartApiTest.php             # 11 feature tests
├── Dockerfile                                # Render deploy
├── render.yaml                               # one-click Render blueprint
└── composer.json
```

## Architectural Notes

- **Laravel 11 conventions**: `bootstrap/app.php` is the new application
  configuration entry point. No `Kernel.php`, no `app/Http/Kernel.php`.
- **API Resources, not raw `$model->toArray()`**: every response is shaped via
  `PartResource` so internal column changes don't leak through the API.
- **Form Requests, not inline validation**: `StorePartRequest` / `UpdatePartRequest`
  keep validation rules out of the controller.
- **Service container, not facades where possible**: the controller uses
  Eloquent's static facade only for `Part::create()` / `Part::query()` —
  no `DB::` facades, no raw SQL.
- **`routes/api.php`**: routes are mounted under `/api/*` automatically by
  Laravel 11's `withRouting(api: ...)` in `bootstrap/app.php`.

## Testing

PHPUnit feature tests cover:

- GET list returns parts with renamed fields (`part_number`, `unit_cost`, etc.)
- GET show returns single part
- GET show returns 404 for missing ID
- GET index filters by `?category=Filters`
- POST without admin token → 403
- POST with unset `ADMIN_TOKEN` env → 403 even if header present (fail-closed)
- POST with valid admin token → 201 + row in DB
- POST with missing required fields → 422 with validation messages
- POST with negative `unit_cost` → 422
- POST with invalid category (`Furnaces`) → 422 (subset enforcement)
- POST with duplicate `part_number` → 422

Run with `ADMIN_TOKEN=test-secret vendor/bin/phpunit`.

## License

MIT
