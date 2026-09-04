<?php

namespace Database\Seeders;

use App\Models\Part;
use Illuminate\Database\Seeder;

/**
 * Seeds the legacy inventory fixture.
 *
 * Uses a different SKU scheme than the Node API (PHP-### prefix vs
 * the Node's FURN-/FILT-/THERM-/MOT-/CTRL-) to demonstrate this is
 * a separate legacy system that would need translation in production.
 * Same real HVAC parts, different codes.
 */
class PartsSeeder extends Seeder
{
    public function run(): void
    {
        $parts = [
            // Filters (5)
            ['part_number' => 'PHP-001', 'name' => 'Filtrete 16x25x1 MERV 12 Pleated Filter (6-pack)', 'description' => 'MERV 12 pleated filter, 6-pack. Captures 54% of small particles, lasts 90 days.', 'unit_cost' => 89.99, 'inventory_qty' => 150, 'bin_location' => 'F-01', 'category' => 'Filters', 'manufacturer' => 'Filtrete'],
            ['part_number' => 'PHP-002', 'name' => 'Honeywell FPR 10 MERV 13 Allergen Filter', 'description' => 'MERV 13 allergen filter, 20x25x4. Captures pollen, dust, and smoke.', 'unit_cost' => 49.99, 'inventory_qty' => 78, 'bin_location' => 'F-02', 'category' => 'Filters', 'manufacturer' => 'Honeywell'],
            ['part_number' => 'PHP-003', 'name' => 'AprilAire 213 MERV 13 Media Filter', 'description' => 'MERV 13 high-performance media filter, 20x25x4. Self-sealing gasket, OEM replacement.', 'unit_cost' => 39.99, 'inventory_qty' => 95, 'bin_location' => 'F-03', 'category' => 'Filters', 'manufacturer' => 'AprilAire'],
            ['part_number' => 'PHP-004', 'name' => 'Nordic Pure 16x20x1 MERV 10 Pleated Filter (12-pack)', 'description' => 'MERV 10 electrostatic synthetic media, bulk pack of 12.', 'unit_cost' => 64.99, 'inventory_qty' => 200, 'bin_location' => 'F-04', 'category' => 'Filters', 'manufacturer' => 'Nordic Pure'],
            ['part_number' => 'PHP-005', 'name' => 'Filtrete Healthy Living 14x14x1 MERV 13 (2-pack)', 'description' => 'MERV 13 allergen and bacteria filter, 62% capture 0.3-1 micron, 2-pack.', 'unit_cost' => 24.99, 'inventory_qty' => 120, 'bin_location' => 'F-05', 'category' => 'Filters', 'manufacturer' => 'Filtrete'],

            // Motors (5)
            ['part_number' => 'PHP-006', 'name' => 'Fasco Blower Motor 1/2 HP Variable Speed', 'description' => '1/2 HP variable-speed ECM blower motor. Direct replacement for Trane/AMC.', 'unit_cost' => 379.00, 'inventory_qty' => 25, 'bin_location' => 'M-01', 'category' => 'Motors', 'manufacturer' => 'Fasco'],
            ['part_number' => 'PHP-007', 'name' => 'A.O. Smith F48H70A02 Blower Motor', 'description' => '1/3 HP 4-speed blower motor, 115V. Replaces many Carrier and Lennox models.', 'unit_cost' => 189.00, 'inventory_qty' => 32, 'bin_location' => 'M-02', 'category' => 'Motors', 'manufacturer' => 'A.O. Smith'],
            ['part_number' => 'PHP-008', 'name' => 'Mars 10856 Condenser Fan Motor 1/4 HP', 'description' => '1/4 HP condenser fan motor, 825 RPM, 208/230V.', 'unit_cost' => 159.00, 'inventory_qty' => 28, 'bin_location' => 'M-03', 'category' => 'Motors', 'manufacturer' => 'Mars'],
            ['part_number' => 'PHP-009', 'name' => 'Fasco Draft Inducer Motor 3200 RPM', 'description' => 'Replacement draft inducer motor for gas furnaces. Fits Carrier, Bryant, Payne.', 'unit_cost' => 119.00, 'inventory_qty' => 45, 'bin_location' => 'M-04', 'category' => 'Motors', 'manufacturer' => 'Fasco'],
            ['part_number' => 'PHP-010', 'name' => 'Century UCF Blower Motor Assembly', 'description' => '1 HP blower motor assembly with module. Belt-drive rated.', 'unit_cost' => 449.00, 'inventory_qty' => 14, 'bin_location' => 'M-05', 'category' => 'Motors', 'manufacturer' => 'Century'],

            // Controls (5)
            ['part_number' => 'PHP-011', 'name' => 'Honeywell ST9120U1003 Universal Furnace Control Board', 'description' => 'Universal furnace control board. 5-LED diagnostics. Replaces 200+ part numbers.', 'unit_cost' => 119.00, 'inventory_qty' => 38, 'bin_location' => 'C-01', 'category' => 'Controls', 'manufacturer' => 'Honeywell'],
            ['part_number' => 'PHP-012', 'name' => 'Carrier HK42FZ007 Control Board', 'description' => 'OEM furnace control board for Carrier 58 series. 4-LED diagnostic.', 'unit_cost' => 219.00, 'inventory_qty' => 18, 'bin_location' => 'C-02', 'category' => 'Controls', 'manufacturer' => 'Carrier'],
            ['part_number' => 'PHP-013', 'name' => 'Mars 11024A Contactor 40A 24V', 'description' => '40A 2-pole contactor with 24V coil. Standard AC contactor.', 'unit_cost' => 24.99, 'inventory_qty' => 200, 'bin_location' => 'C-03', 'category' => 'Controls', 'manufacturer' => 'Mars'],
            ['part_number' => 'PHP-014', 'name' => 'GE 45+5 MFD Dual Run Capacitor 440V', 'description' => '45+5 MFD dual run capacitor, 440V oval. Replaces many OEM part numbers.', 'unit_cost' => 18.99, 'inventory_qty' => 175, 'bin_location' => 'C-04', 'category' => 'Controls', 'manufacturer' => 'GE'],
            ['part_number' => 'PHP-015', 'name' => 'White-Rodgers 50A55-843 Universal Furnace Control', 'description' => 'White-Rodgers universal furnace control module. Replaces hundreds of OEM controls.', 'unit_cost' => 159.00, 'inventory_qty' => 22, 'bin_location' => 'C-05', 'category' => 'Controls', 'manufacturer' => 'White-Rodgers'],

            // Ductwork (5)
            ['part_number' => 'PHP-016', 'name' => '8" Galvanized Round Duct Pipe (2 ft)', 'description' => 'Galvanized steel round duct, 8" diameter, 24" length. Snap-lock ends.', 'unit_cost' => 14.99, 'inventory_qty' => 88, 'bin_location' => 'D-01', 'category' => 'Ductwork', 'manufacturer' => 'Generic'],
            ['part_number' => 'PHP-017', 'name' => '8" Insulated Flexible Duct R8 (25 ft)', 'description' => 'R8 insulated flexible duct, 8" diameter, 25 ft length. Vapor barrier jacket.', 'unit_cost' => 79.99, 'inventory_qty' => 42, 'bin_location' => 'D-02', 'category' => 'Ductwork', 'manufacturer' => 'Atco'],
            ['part_number' => 'PHP-018', 'name' => '10x8 Rectangular Duct Elbow 90°', 'description' => 'Galvanized 90-degree rectangular duct elbow, 10"x8". Stamped steel.', 'unit_cost' => 22.99, 'inventory_qty' => 56, 'bin_location' => 'D-03', 'category' => 'Ductwork', 'manufacturer' => 'Generic'],
            ['part_number' => 'PHP-019', 'name' => '8" Manual Volume Damper', 'description' => '8" round manual volume damper with locking quadrant. Galvanized steel.', 'unit_cost' => 18.99, 'inventory_qty' => 63, 'bin_location' => 'D-04', 'category' => 'Ductwork', 'manufacturer' => 'Lau'],
            ['part_number' => 'PHP-020', 'name' => '10x6 Floor Register Louvered', 'description' => 'Steel floor register with louvered face, 10"x6". Brown finish.', 'unit_cost' => 9.99, 'inventory_qty' => 140, 'bin_location' => 'D-05', 'category' => 'Ductwork', 'manufacturer' => 'Hart & Cooley'],
        ];

        foreach ($parts as $part) {
            Part::create($part);
        }
    }
}
