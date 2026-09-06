import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Vitest config for the storefront test suite.
 *
 * Migrated from the (dead) inline `vitest` key in `package.json` —
 * supported Vitest config sources are `vite.config.*` / `vitest.config.*`
 * only. The `@vitejs/plugin-react` plugin is required to transform JSX
 * under Next.js's `"jsx": "preserve"` TS setting so `.test.tsx` files
 * run under happy-dom.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
  },
});
