import { z } from 'zod';

/**
 * Categories accepted by the PHP API's `StorePartRequest` / `UpdatePartRequest`.
 * Deliberately a subset of the Node API's `ProductCategory` (no Furnaces or
 * Thermostats here). The constant is exported separately so the form's
 * `<select>` and the schema cannot drift.
 */
export const CATEGORIES = ['Filters', 'Motors', 'Controls', 'Ductwork'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Base field shape. Used to derive both the create schema (all required) and
 * the edit schema (all optional, partial updates).
 *
 * Mirrors `apps/php-api/app/Http/Requests/StorePartRequest.php` and
 * `UpdatePartRequest.php`. Server-side validation in the hub is an authoritative
 * gate; client-side validation is UX.
 */
const baseFields = z.object({
  part_number: z.string().min(1, 'Part number is required').max(50, 'Part number must be 50 characters or fewer'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or fewer'),
  description: z.string().min(1, 'Description is required'),
  unit_cost: z.number({ invalid_type_error: 'Unit cost must be a number' }).min(0, 'Unit cost must be at least 0'),
  inventory_qty: z.number({ invalid_type_error: 'Inventory quantity must be a number' }).int('Inventory quantity must be a whole number').min(0, 'Inventory quantity must be at least 0'),
  bin_location: z.string().max(50, 'Bin location must be 50 characters or fewer').nullable().optional(),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  }),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100, 'Manufacturer must be 100 characters or fewer'),
});

/** Schema for POST /api/parts (create). All fields required. */
export const createPartSchema = baseFields;

/** Schema for PATCH /api/parts/{part} (edit). All fields optional — partial updates. */
export const updatePartSchema = baseFields.partial();

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;

/**
 * Shape returned by `submitPartAction`. Field-keyed errors are what the form
 * renders below each input; a top-level `error` is for non-field-failure cases
 * (network unreachable, etc.).
 */
export type SubmitPartState =
  | { ok: true; redirectTo: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string };
