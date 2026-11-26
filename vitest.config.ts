import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['web', 'shared'],
    coverage: {
      provider: 'v8',
      include: ['web/src/**/*.{ts,tsx}', 'shared/src/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'web/src/main.tsx'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
