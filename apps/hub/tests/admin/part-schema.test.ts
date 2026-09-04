import { describe, expect, it } from 'vitest';
import {
  createPartSchema,
  updatePartSchema,
  CATEGORIES,
} from '../../src/lib/part-schema';

const validCreate = {
  part_number: 'PHP-001',
  name: 'Filter A',
  description: 'HVAC filter',
  unit_cost: 89.99,
  inventory_qty: 100,
  bin_location: 'A1',
  category: 'Filters',
  manufacturer: 'Honeywell',
};

describe('CATEGORIES', () => {
  it('contains exactly the four PHP-API-allowed categories', () => {
    expect(CATEGORIES).toEqual(['Filters', 'Motors', 'Controls', 'Ductwork']);
  });

  it('does not include Node API categories (Furnaces, Thermostats)', () => {
    expect(CATEGORIES).not.toContain('Furnaces');
    expect(CATEGORIES).not.toContain('Thermostats');
  });
});

describe('createPartSchema', () => {
  it('accepts a valid create payload', () => {
    const result = createPartSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('accepts a missing bin_location', () => {
    const result = createPartSchema.safeParse({ ...validCreate, bin_location: undefined });
    expect(result.success).toBe(true);
  });

  it('rejects an empty part_number', () => {
    const result = createPartSchema.safeParse({ ...validCreate, part_number: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'part_number')).toBe(true);
    }
  });

  it('rejects a part_number longer than 50 characters', () => {
    const result = createPartSchema.safeParse({ ...validCreate, part_number: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('rejects a negative unit_cost', () => {
    const result = createPartSchema.safeParse({ ...validCreate, unit_cost: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'unit_cost')).toBe(true);
    }
  });

  it('accepts unit_cost of exactly 0', () => {
    const result = createPartSchema.safeParse({ ...validCreate, unit_cost: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects a negative inventory_qty', () => {
    const result = createPartSchema.safeParse({ ...validCreate, inventory_qty: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer inventory_qty', () => {
    const result = createPartSchema.safeParse({ ...validCreate, inventory_qty: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects a category not in CATEGORIES (Furnaces)', () => {
    const result = createPartSchema.safeParse({ ...validCreate, category: 'Furnaces' });
    expect(result.success).toBe(false);
  });

  it('rejects a category not in CATEGORIES (Thermostats)', () => {
    const result = createPartSchema.safeParse({ ...validCreate, category: 'Thermostats' });
    expect(result.success).toBe(false);
  });

  it('accepts each of the four valid categories', () => {
    for (const category of CATEGORIES) {
      const result = createPartSchema.safeParse({ ...validCreate, category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a name longer than 255 characters', () => {
    const result = createPartSchema.safeParse({ ...validCreate, name: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects a manufacturer longer than 100 characters', () => {
    const result = createPartSchema.safeParse({ ...validCreate, manufacturer: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects a bin_location longer than 50 characters', () => {
    const result = createPartSchema.safeParse({ ...validCreate, bin_location: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });
});

describe('updatePartSchema', () => {
  it('accepts a payload with no fields (no-op update is allowed by the schema; the server-action wrapper may choose to reject)', () => {
    const result = updatePartSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload', () => {
    const result = updatePartSchema.safeParse({ inventory_qty: 25 });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid category if provided', () => {
    const result = updatePartSchema.safeParse({ category: 'Furnaces' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative unit_cost if provided', () => {
    const result = updatePartSchema.safeParse({ unit_cost: -1 });
    expect(result.success).toBe(false);
  });
});
