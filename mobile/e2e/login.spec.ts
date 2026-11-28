import {
  _android,
  expect,
  test,
  type AndroidDevice,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
const APP = 'http://localhost';
const PACKAGE = 'ec.yawar.mobile';

// Fictional donor, new on every run; the password is generated so none is stored in the repo.
const email = `e2e.mobile.${Date.now()}@example.test`;
const password = `E2e-${crypto.randomUUID()}`;

let device: AndroidDevice;

/** Starts the installed app from a clean state: no session, no history. */
async function launch(): Promise<Page> {
  await device.shell(`pm clear ${PACKAGE}`);
  await device.shell(`am start -W -n ${PACKAGE}/.MainActivity`);
  const page = await (await device.webView({ pkg: PACKAGE })).page();
  await page.getByRole('main').waitFor();
  return page;
}

async function openSignIn(page: Page) {
  await page.goto(`${APP}/donor`);
  await page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('#username')).toBeVisible();
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

test.beforeAll(async () => {
  const [first] = await _android.devices();
  if (!first) throw new Error('No Android device: start an emulator first.');
  device = first;
});

test.afterAll(async () => {
  await device?.close();
});

test('the back button returns from the sign-in page to the app', async () => {
  const page = await launch();
  await openSignIn(page);

  await device.shell('input keyevent KEYCODE_BACK');

  await expect(page).toHaveURL(new RegExp(`^${APP}/donor`));
  await expect(page.getByRole('main')).toBeVisible();
});

test('donor signs up, signs out and signs in again in the Android app', async ({ request }) => {
  const page = await launch();
  await page.goto(`${APP}/signup`);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continuar con correo' }).click();

  await expect(page).toHaveURL(/client_id=yawar-mobile/);
  await expect(page).toHaveURL(/code_challenge_method=S256/);
  await page.locator('input[name="privacy_consent"][value="accepted"]').check();
  await page.locator('[type="submit"]').click();
  await expect(page.getByText('Verificación del email').first()).toBeVisible();

  await page.goto(await verificationLink(request));
  await page.locator('input[name="password-new"]').fill(password);
  await page.locator('input[name="password-confirm"]').fill(password);
  await page.locator('[type="submit"]').click();
  await expectDonorHome(page);

  // Tokens live in memory: after a reload one tap restores the session, without the password.
  await page.reload();
  await page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }).click();
  await expectDonorHome(page);
  const stored = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]));
  expect(stored).not.toMatch(/eyJ[\w-]+\./); // no JWT in web storage

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(`${APP}/`);

  await openSignIn(page);
  await page.locator('#username').fill(email);
  // Keycloak may ask for the username and the password on separate screens.
  if (!(await page.locator('#password').isVisible())) {
    await page.locator('[type="submit"]').click();
  }
  await page.locator('#password').fill(password);
  await page.locator('[type="submit"]').click();
  await expectDonorHome(page);
  await device.screenshot({ path: test.info().outputPath('donor-home.png') });
});
