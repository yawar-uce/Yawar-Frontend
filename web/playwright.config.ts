import { defineConfig, devices } from '@playwright/test';

/** End-to-end against the local stack of Yawar-Backend (Keycloak, API Gateway, ms-donors, Mailpit). */
export default defineConfig({
  testDir: './e2e',
  // The scenarios share one account, so they run in order.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
