<?php

use App\Http\Controllers\PartController;
use Illuminate\Support\Facades\Route;

// Laravel 11 withRouting(api: ...) auto-prefixes these routes with /api.
// So `Route::get('parts', ...)` resolves to /api/parts.
Route::get('parts', [PartController::class, 'index']);

// {part} binds to Part by part_number (see bootstrap/app.php Route::bind).
// No whereNumber constraint — alphanumeric SKUs like "PHP-001" must match.
// Unknown part_numbers fall through to firstOrFail() and return 404.
Route::get('parts/{part}', [PartController::class, 'show']);
Route::post('parts', [PartController::class, 'store']);
Route::patch('parts/{part}', [PartController::class, 'update']);
Route::put('parts/{part}', [PartController::class, 'update']);
