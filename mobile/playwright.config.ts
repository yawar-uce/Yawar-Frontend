import { defineConfig } from '@playwright/test';

/** Sign-in of the Android app on a running emulator against the local stack of Yawar-Backend. */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
});
