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
}
