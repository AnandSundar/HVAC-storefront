<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    use HasFactory;

    protected $fillable = [
        'part_number',
        'name',
        'description',
        'unit_cost',
        'inventory_qty',
        'bin_location',
        'category',
        'manufacturer',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'inventory_qty' => 'integer',
    ];
}
