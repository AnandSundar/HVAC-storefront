<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the parts table.
     *
     * Field names deliberately differ from the Node API (KTD-5):
     *   part_number  (Node: sku)
     *   unit_cost    (Node: price)
     *   inventory_qty (Node: stock)
     *   bin_location (extra — no Node equivalent)
     *
     * Categories are also a subset of the Node API: Filters, Motors,
     * Controls, Ductwork. Node API additionally has Furnaces + Thermostats.
     */
    public function up(): void
    {
        Schema::create('parts', function (Blueprint $table) {
            $table->id();
            $table->string('part_number', 50)->unique();
            $table->string('name');
            $table->text('description');
            $table->decimal('unit_cost', 10, 2);
            $table->unsignedInteger('inventory_qty');
            $table->string('bin_location', 50)->nullable();
            $table->string('category', 20);
            $table->string('manufacturer', 100);
            $table->timestamps();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parts');
    }
};
