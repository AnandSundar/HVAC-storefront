<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePartRequest;
use App\Http\Requests\UpdatePartRequest;
use App\Http\Resources\PartResource;
use App\Models\Part;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartController
{
    /**
     * Allowed categories for the parts inventory.
     * Deliberately a subset of the Node API categories (KTD-5):
     *   - Filters, Motors, Controls, Ductwork
     * Node API additionally has Furnaces and Thermostats.
     */
    private const ALLOWED_CATEGORIES = ['Filters', 'Motors', 'Controls', 'Ductwork'];

    /**
     * GET /api/parts
     * List parts with optional category filter + pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Part::query();

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(1, min($perPage, 100));

        $parts = $query->orderBy('id')->paginate($perPage);

        return PartResource::collection($parts);
    }

    /**
     * GET /api/parts/{part}
     * Show a single part. Returns 404 if missing (route model binding).
     */
    public function show(Part $part): PartResource
    {
        return new PartResource($part);
    }

    /**
     * POST /api/parts
     * Create a part. Gated by admin-token check (fail-closed).
     *
     * Mock auth choice: inline check here (not middleware) so the rule
     * "ADMIN_TOKEN unset => all POSTs rejected" is co-located with the
     * single endpoint that needs it. Documented in README.
     */
    public function store(StorePartRequest $request): JsonResponse
    {
        if (! $this->adminTokenIsValid($request)) {
            return response()->json(
                ['error' => 'Admin authentication required'],
                403
            );
        }

        $part = Part::create($request->validated());

        return (new PartResource($part))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/parts/{part}
     * Update a part. Same admin-token gate as store.
     */
    public function update(UpdatePartRequest $request, Part $part): PartResource
    {
        if (! $this->adminTokenIsValid($request)) {
            return response()->json(
                ['error' => 'Admin authentication required'],
                403
            );
        }

        $part->update($request->validated());

        return new PartResource($part);
    }

    /**
     * DELETE /api/parts/{part}
     * Delete a part. Same admin-token gate as store/update.
     * Returns 204 No Content on success (idiomatic REST for DELETE).
     * 404 falls through the route-model binding (firstOrFail) via the bootstrap
     * exception handler, which renders JSON because the path matches `api/*`.
     */
    public function destroy(Request $request, Part $part): \Symfony\Component\HttpFoundation\Response
    {
        if (! $this->adminTokenIsValid($request)) {
            return response()->json(
                ['error' => 'Admin authentication required'],
                403
            );
        }

        $part->delete();

        return response()->noContent();
    }

    /**
     * Fail-closed admin-token check.
     *
     * Returns true only when ALL of:
     *   1. ADMIN_TOKEN env var is set (non-empty)
     *   2. Request includes `X-Admin-Token` header
     *   3. Header value matches env var via hash_equals (timing-safe)
     *
     * If ADMIN_TOKEN is unset, even a header containing a guess is rejected —
     * this prevents accidental admin access on a misconfigured deploy.
     */
    private function adminTokenIsValid(Request $request): bool
    {
        $expected = env('ADMIN_TOKEN');

        if (! is_string($expected) || $expected === '') {
            return false;
        }

        $provided = $request->header('X-Admin-Token');

        if (! is_string($provided) || $provided === '') {
            return false;
        }

        return hash_equals($expected, $provided);
    }
}
