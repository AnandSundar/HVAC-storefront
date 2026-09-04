<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * PATCH / PUT rules. `part_number` is unique except for the current row,
     * so re-submitting an existing part_number is allowed.
     *
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        $partId = $this->route('part')?->id;

        return [
            'part_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                'unique:parts,part_number,'.$partId,
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'unit_cost' => ['sometimes', 'required', 'numeric', 'min:0'],
            'inventory_qty' => ['sometimes', 'required', 'integer', 'min:0'],
            'bin_location' => ['sometimes', 'nullable', 'string', 'max:50'],
            'category' => ['sometimes', 'required', 'in:Filters,Motors,Controls,Ductwork'],
            'manufacturer' => ['sometimes', 'required', 'string', 'max:100'],
        ];
    }
}
