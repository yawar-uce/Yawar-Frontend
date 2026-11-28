import { defineConfig } from '@playwright/test';

/** Sign-in of the desktop app against the local stack of Yawar-Backend (needs `npm run build` first). */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
});
