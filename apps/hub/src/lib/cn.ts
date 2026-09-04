import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind-aware deduplication.
 *
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (resolves conflicting Tailwind utilities, last-write-wins).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
