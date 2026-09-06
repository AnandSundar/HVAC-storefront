/**
 * Vitest setup — registers `@testing-library/jest-dom` matchers on the
 * global `expect` so tests can use `toBeInTheDocument`, `toHaveAttribute`,
 * and the rest of the DOM-aware assertions. Imported once via the
 * `setupFiles` entry in `vitest.config.ts`.
 */
import '@testing-library/jest-dom/vitest';
