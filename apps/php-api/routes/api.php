<?php

use App\Http\Controllers\PartController;
use Illuminate\Support\Facades\Route;

// Laravel 11 withRouting(api: ...) auto-prefixes these routes with /api.
// So `Route::get('parts', ...)` resolves to /api/parts.
Route::get('parts', [PartController::class, 'index']);
Route::get('parts/{part}', [PartController::class, 'show'])->whereNumber('part');
Route::post('parts', [PartController::class, 'store']);
Route::patch('parts/{part}', [PartController::class, 'update'])->whereNumber('part');
Route::put('parts/{part}', [PartController::class, 'update'])->whereNumber('part');
