import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { _electron, expect, test, type APIRequestContext, type Page } from '@playwright/test';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
const APP = 'http://localhost:5180';

// Fictional donor, new on every run; the password is generated so none is stored in the repo.
const email = `e2e.desktop.${Date.now()}@example.test`;
const password = `E2e-${crypto.randomUUID()}`;

/** Runs the sources by default; DESKTOP_APP_PATH points the test at a packaged executable instead. */
async function launch(userData: string) {
  const executablePath = process.env.DESKTOP_APP_PATH;
  const args = [`--user-data-dir=${userData}`];
  // The sandbox helper of the npm download is not set up on Linux development machines and runners.
  if (!executablePath && process.platform === 'linux') args.push('--no-sandbox');
  const app = await _electron.launch(
    executablePath ? { executablePath, args } : { args: [...args, '.'] },
  );
  return { app, page: await app.firstWindow() };
}

async function verificationLink(request: APIRequestContext): Promise<string> {
  const search = async () => {
    const response = await request.get(`${MAILPIT}/api/v1/search`, {
      params: { query: `to:${email}` },
    });
    return response.json();
  };
  await expect.poll(async () => (await search()).messages_count).toBeGreaterThan(0);
  const [message] = (await search()).messages;
  const body = await (await request.get(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
  return body.Text.match(/https?:\/\/\S*action-token\S*/)[0];
}

async function expectDonorHome(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Portal del donante' })).toBeVisible();
  // Only the answer of GET /api/v1/donors/me through the gateway fills this list.
  await expect(page.getByRole('listitem')).toContainText('Tratamiento de datos personales');
}

test('the menu returns from the sign-in page to the app', async () => {
  const userData = await mkdtemp(path.join(tmpdir(), 'yawar-e2e-'));
  const { app, page } = await launch(userData);
  try {
    await page.goto(`${APP}/donor`);
    await page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.locator('#username')).toBeVisible();

    await app.evaluate(({ Menu }) => Menu.getApplicationMenu()?.getMenuItemById('home')?.click());

    await expect(page).toHaveURL(`${APP}/`);
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('donor signs up, signs out and signs in again in the desktop app', async ({ request }) => {
  const userData = await mkdtemp(path.join(tmpdir(), 'yawar-e2e-'));
  const { app, page } = await launch(userData);
  try {
    await page.getByRole('main').waitFor();
    await page.goto(`${APP}/signup`);
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Continuar con correo' }).click();

    await expect(page).toHaveURL(/client_id=yawar-desktop/);
    await expect(page).toHaveURL(/code_challenge_method=S256/);
    await page.locator('input[name="privacy_consent"][value="accepted"]').check();
    await page.locator('[type="submit"]').click();
    await expect(page.getByText('Verificación del email').first()).toBeVisible();

    await page.goto(await verificationLink(request));
    await page.locator('input[name="password-new"]').fill(password);
    await page.locator('input[name="password-confirm"]').fill(password);
    await page.locator('[type="submit"]').click();
    await expectDonorHome(page);

    // Tokens live in memory: a reload restores the session with the silent check.
    await page.reload();
    await expectDonorHome(page);
    const stored = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]));
    expect(stored).not.toMatch(/eyJ[\w-]+\./); // no JWT in web storage

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(`${APP}/`);

    await page.goto(`${APP}/donor`);
    await page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.locator('#username').fill(email);
    // Keycloak may ask for the username and the password on separate screens.
    if (!(await page.locator('#password').isVisible())) {
      await page.locator('[type="submit"]').click();
    }
    await page.locator('#password').fill(password);
    await page.locator('[type="submit"]').click();
    await expectDonorHome(page);
    await page.screenshot({ path: test.info().outputPath('donor-home.png') });
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
