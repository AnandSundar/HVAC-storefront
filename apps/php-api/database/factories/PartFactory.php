<?php

namespace Database\Factories;

use App\Models\Part;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Part>
 */
class PartFactory extends Factory
{
    protected $model = Part::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Filters', 'Motors', 'Controls', 'Ductwork'];
        $manufacturers = ['Filtrete', 'Honeywell', 'AprilAire', 'Fasco', 'A.O. Smith', 'Mars', 'GE', 'White-Rodgers', 'Carrier', 'Lennox'];

        return [
            'part_number' => strtoupper($this->faker->unique()->bothify('??-###')),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'unit_cost' => $this->faker->randomFloat(2, 5, 500),
            'inventory_qty' => $this->faker->numberBetween(0, 200),
            'bin_location' => 'A' . $this->faker->numberBetween(1, 99),
            'category' => $this->faker->randomElement($categories),
            'manufacturer' => $this->faker->randomElement($manufacturers),
        ];
    }
}
