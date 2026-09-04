<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePartRequest extends FormRequest
{
    /**
     * Public POST is gated by the controller's admin-token check
     * before this request is constructed, so no auth() gate here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'part_number' => ['required', 'string', 'max:50', 'unique:parts,part_number'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'inventory_qty' => ['required', 'integer', 'min:0'],
            'bin_location' => ['nullable', 'string', 'max:50'],
            'category' => ['required', 'in:Filters,Motors,Controls,Ductwork'],
            'manufacturer' => ['required', 'string', 'max:100'],
        ];
    }
}
