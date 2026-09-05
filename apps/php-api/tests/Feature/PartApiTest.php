<?php

namespace Tests\Feature;

use App\Models\Part;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed enough parts to validate list/pagination/filtering.
        Part::factory()->count(20)->create();
    }

    /**
     * GET /api/parts returns a paginated JSON collection with part_number,
     * unit_cost, inventory_qty, category — all the deliberately-renamed fields.
     */
    public function test_index_returns_parts_with_php_field_names(): void
    {
        $response = $this->getJson('/api/parts');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'part_number',
                    'name',
                    'description',
                    'unit_cost',
                    'inventory_qty',
                    'bin_location',
                    'category',
                    'manufacturer',
                    'created_at',
                    'updated_at',
                ],
            ],
        ]);
        $this->assertGreaterThanOrEqual(15, count($response->json('data')));
    }

    public function test_show_returns_single_part(): void
    {
        // {part} binds by part_number, not by primary key. The public contract
        // is the human-readable SKU; recruiters demo against it.
        $part = Part::first();

        $response = $this->getJson("/api/parts/{$part->part_number}");

        $response->assertOk();
        $response->assertJson([
            'data' => [
                'id' => $part->id,
                'part_number' => $part->part_number,
            ],
        ]);
    }

    public function test_show_returns_404_for_missing_part(): void
    {
        // 404 path now goes through the binding resolver (firstOrFail), not
        // a numeric route constraint.
        $response = $this->getJson('/api/parts/UNKNOWN-999');

        $response->assertNotFound();
    }

    public function test_index_filters_by_category(): void
    {
        // Create at least one part with a known category.
        Part::factory()->create(['category' => 'Filters']);

        $response = $this->getJson('/api/parts?category=Filters');

        $response->assertOk();
        $categories = array_unique(array_column($response->json('data'), 'category'));
        $this->assertEquals(['Filters'], $categories);
    }

    public function test_store_without_admin_token_returns_403(): void
    {
        // Clear the admin token (phpunit.xml sets it by default).
        putenv('ADMIN_TOKEN');

        $payload = [
            'part_number' => 'TEST-001',
            'name' => 'Test Part',
            'description' => 'Test description',
            'unit_cost' => 10.00,
            'inventory_qty' => 5,
            'category' => 'Filters',
            'manufacturer' => 'Test Co',
        ];

        $response = $this->postJson('/api/parts', $payload);

        $response->assertStatus(403);
        $response->assertJson(['error' => 'Admin authentication required']);
        $this->assertDatabaseMissing('parts', ['part_number' => 'TEST-001']);
    }

    public function test_store_with_unset_admin_token_rejects_even_correct_guess(): void
    {
        // ADMIN_TOKEN is unset; even a header containing any value must be rejected.
        putenv('ADMIN_TOKEN');

        $payload = [
            'part_number' => 'TEST-002',
            'name' => 'Test Part',
            'description' => 'Test description',
            'unit_cost' => 10.00,
            'inventory_qty' => 5,
            'category' => 'Filters',
            'manufacturer' => 'Test Co',
        ];

        $response = $this->postJson('/api/parts', $payload, [
            'X-Admin-Token' => 'any-value',
        ]);

        $response->assertStatus(403);
    }

    public function test_store_with_admin_token_creates_part(): void
    {
        // phpunit.xml sets ADMIN_TOKEN=test-secret
        $payload = [
            'part_number' => 'TEST-100',
            'name' => 'Test Part',
            'description' => 'Test description',
            'unit_cost' => 10.00,
            'inventory_qty' => 5,
            'category' => 'Filters',
            'manufacturer' => 'Test Co',
        ];

        $response = $this->postJson('/api/parts', $payload, [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'data' => [
                'part_number' => 'TEST-100',
                'unit_cost' => '10.00',
                'inventory_qty' => 5,
                'category' => 'Filters',
            ],
        ]);
        $this->assertDatabaseHas('parts', ['part_number' => 'TEST-100']);
    }

    public function test_store_with_missing_required_fields_returns_422(): void
    {
        $response = $this->postJson('/api/parts', [], [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'part_number',
            'name',
            'description',
            'unit_cost',
            'inventory_qty',
            'category',
            'manufacturer',
        ]);
    }

    public function test_store_with_negative_unit_cost_returns_422(): void
    {
        $payload = [
            'part_number' => 'TEST-NEG',
            'name' => 'Test',
            'description' => 'x',
            'unit_cost' => -5.00,
            'inventory_qty' => 1,
            'category' => 'Filters',
            'manufacturer' => 'x',
        ];

        $response = $this->postJson('/api/parts', $payload, [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['unit_cost']);
    }

    public function test_store_with_invalid_category_returns_422(): void
    {
        $payload = [
            'part_number' => 'TEST-BAD-CAT',
            'name' => 'Test',
            'description' => 'x',
            'unit_cost' => 1.00,
            'inventory_qty' => 1,
            'category' => 'Furnaces', // not allowed in PHP API
            'manufacturer' => 'x',
        ];

        $response = $this->postJson('/api/parts', $payload, [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['category']);
    }

    public function test_store_with_duplicate_part_number_returns_422(): void
    {
        $existing = Part::first();

        $payload = [
            'part_number' => $existing->part_number,
            'name' => 'Test',
            'description' => 'x',
            'unit_cost' => 1.00,
            'inventory_qty' => 1,
            'category' => 'Filters',
            'manufacturer' => 'x',
        ];

        $response = $this->postJson('/api/parts', $payload, [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['part_number']);
    }

    public function test_destroy_without_admin_token_returns_403(): void
    {
        // Clear the admin token (phpunit.xml sets it by default).
        putenv('ADMIN_TOKEN');
        $part = Part::first();

        $response = $this->deleteJson("/api/parts/{$part->part_number}");

        $response->assertStatus(403);
        $response->assertJson(['error' => 'Admin authentication required']);
        // The row must remain — 403 must not delete.
        $this->assertDatabaseHas('parts', ['part_number' => $part->part_number]);
    }

    public function test_destroy_with_unset_admin_token_rejects_even_correct_guess(): void
    {
        // ADMIN_TOKEN must be unset across ALL env sources — putenv() alone is not
        // enough because Laravel's env() helper reads from the Dotenv repository
        // which also consults $_ENV and $_SERVER, and phpunit.xml populates
        // $_SERVER via its `<env>` directive. Clearing all three sources makes the
        // test exercise the true fail-closed path: correct header + empty env
        // must still 403.
        putenv('ADMIN_TOKEN');
        unset($_ENV['ADMIN_TOKEN'], $_SERVER['ADMIN_TOKEN']);
        $part = Part::first();

        $response = $this->deleteJson("/api/parts/{$part->part_number}", [], [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('parts', ['part_number' => $part->part_number]);
    }

    public function test_destroy_with_valid_token_returns_204_and_deletes(): void
    {
        // phpunit.xml sets ADMIN_TOKEN=test-secret
        $part = Part::first();

        $response = $this->deleteJson("/api/parts/{$part->part_number}", [], [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertNoContent();
        $this->assertDatabaseMissing('parts', ['part_number' => $part->part_number]);
    }

    public function test_destroy_on_missing_sku_returns_404(): void
    {
        $response = $this->deleteJson('/api/parts/UNKNOWN-999', [], [
            'X-Admin-Token' => 'test-secret',
        ]);

        $response->assertNotFound();
    }

    public function test_destroy_options_preflight_advertises_delete_method(): void
    {
        // HandleCors middleware intercepts the OPTIONS preflight before route
        // resolution. X-Admin-Token is not required for preflight (it is browser-
        // initiated), but the request must carry Origin + Access-Control-Request-*
        // headers for the middleware to respond with a CORS allow-list.
        //
        // Note: fruitcake/php-cors handlePreflightRequest() returns 204 No Content
        // (see vendor/fruitcake/php-cors/src/CorsService.php:148) — not 200. 204
        // is the spec-compliant response per RFC 7230 §3.3.2 for preflight.
        $response = $this->call('OPTIONS', '/api/parts/PHP-001', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:3000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'DELETE',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'x-admin-token,content-type',
        ]);

        $response->assertNoContent();
        $allowedMethods = $response->headers->get('Access-Control-Allow-Methods');
        $this->assertNotNull(
            $allowedMethods,
            'Access-Control-Allow-Methods header missing from preflight response',
        );
        $this->assertStringContainsString('DELETE', $allowedMethods);
    }
}
