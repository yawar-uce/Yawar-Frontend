import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['web', 'shared', 'desktop'],
    coverage: {
      provider: 'v8',
      include: ['web/src/**/*.{ts,tsx}', 'shared/src/**/*.ts', 'desktop/src/**/*.js'],
      // The entry points only wire things together; the end-to-end tests run them.
      exclude: ['**/*.test.{ts,tsx,js}', 'web/src/main.tsx', 'desktop/src/main.js'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
