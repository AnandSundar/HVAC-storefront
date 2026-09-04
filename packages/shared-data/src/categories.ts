import type { Category } from './types.js';

export const categories: Category[] = [
  {
    slug: 'furnaces',
    name: 'Furnaces',
    description: 'High-efficiency gas furnaces for residential and light commercial use.',
    icon: 'flame',
  },
  {
    slug: 'filters',
    name: 'Filters',
    description: 'Air filters for HVAC systems — MERV 8 through MERV 16.',
    icon: 'filter',
  },
  {
    slug: 'thermostats',
    name: 'Thermostats',
    description: 'Programmable, Wi-Fi, and smart thermostats.',
    icon: 'thermometer',
  },
  {
    slug: 'motors',
    name: 'Motors',
    description: 'Blower motors, draft inducer motors, and condenser fan motors.',
    icon: 'cog',
  },
  {
    slug: 'controls',
    name: 'Controls',
    description: 'Control boards, relays, contactors, and capacitors.',
    icon: 'circuit-board',
  },
  {
    slug: 'ductwork',
    name: 'Ductwork',
    description: 'Galvanized and flexible ducting, fittings, and dampers.',
    icon: 'wind',
  },
];

export const findCategory = (name: string): Category | undefined =>
  categories.find((c) => c.name === name);
