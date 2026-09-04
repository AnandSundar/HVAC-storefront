<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Field names deliberately differ from the Node API to demonstrate
     * cross-stack data variation (KTD-5):
     *   - Node: sku      -> PHP: part_number
     *   - Node: price    -> PHP: unit_cost
     *   - Node: stock    -> PHP: inventory_qty
     *   - Plus extra `bin_location` column with no Node equivalent.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'part_number' => $this->part_number,
            'name' => $this->name,
            'description' => $this->description,
            'unit_cost' => $this->unit_cost,
            'inventory_qty' => $this->inventory_qty,
            'bin_location' => $this->bin_location,
            'category' => $this->category,
            'manufacturer' => $this->manufacturer,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
