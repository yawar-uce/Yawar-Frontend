import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const KEYCLOAK = process.env.E2E_KEYCLOAK_URL ?? 'http://localhost:8080';
const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';
const REALM = 'yawar-dev';

// Fictional donor, new on every run; the password is generated so none is stored in the repo.
const run = `${Date.now()}`;
const email = `e2e.${run}@example.test`;
const password = `E2e-${crypto.randomUUID()}`;

const CONSENT_REQUIRED =
  'Necesitamos tu consentimiento para tratar tus datos (LOPDP) y crear tu cuenta.';

async function continueWithEmail(page: Page, address: string, consent = true) {
  await page.goto('/signup');
  await page.getByLabel('Correo electrónico').fill(address);
  if (consent) await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continuar con correo' }).click();
}

async function submitKeycloakRegistration(page: Page) {
  await page.locator('input[name="privacy_consent"][value="accepted"]').check();
  await page.locator('[type="submit"]').click();
}

async function mailCount(request: APIRequestContext, address: string): Promise<number> {
  const response = await request.get(`${MAILPIT}/api/v1/search`, {
    params: { query: `to:${address}` },
  });
  return (await response.json()).messages_count;
}

async function verificationLink(request: APIRequestContext, address: string): Promise<string> {
  await expect.poll(() => mailCount(request, address)).toBeGreaterThan(0);
  const search = await request.get(`${MAILPIT}/api/v1/search`, {
    params: { query: `to:${address}` },
  });
  const [message] = (await search.json()).messages;
  const body = await (await request.get(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
  return body.Text.match(/https?:\/\/\S*action-token\S*/)[0];
}

async function expectDonorHome(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Portal del donante' })).toBeVisible();
  // Only the answer of GET /api/v1/donors/me through the gateway fills this list.
  await expect(page.getByRole('listitem')).toContainText('Tratamiento de datos personales');
}

// A failure skips the rest: a restarted worker would not know the account of this run.
test.describe.configure({ mode: 'serial' });

/** Removes the account of this run when the local Keycloak admin password is provided. */
test.afterAll(async ({ playwright }) => {
  const adminPassword = process.env.E2E_KEYCLOAK_ADMIN_PASSWORD;
  if (!adminPassword) return;
  const request = await playwright.request.newContext();
  const token = await request.post(`${KEYCLOAK}/realms/master/protocol/openid-connect/token`, {
    form: {
      grant_type: 'password',
      client_id: 'admin-cli',
      username: process.env.E2E_KEYCLOAK_ADMIN_USER ?? 'admin',
      password: adminPassword,
    },
  });
  const headers = { Authorization: `Bearer ${(await token.json()).access_token}` };
  const users = await request.get(`${KEYCLOAK}/admin/realms/${REALM}/users`, {
    headers,
    params: { email, exact: 'true' },
  });
  for (const user of await users.json()) {
    await request.delete(`${KEYCLOAK}/admin/realms/${REALM}/users/${user.id}`, { headers });
  }
  await request.dispose();
});

test('hu01_sc3 without consent no account is created and the reason is explained', async ({
  page,
  request,
}) => {
  const address = `e2e.noconsent.${run}@example.test`;

  await continueWithEmail(page, address, false);

  await expect(page.getByRole('alert')).toHaveText(CONSENT_REQUIRED);
  await expect(page).toHaveURL(/\/signup$/);

  // The identity provider refuses it too, even if the app's check is skipped.
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continuar con correo' }).click();
  await page.locator('#email').fill(address);
  await page.locator('[type="submit"]').click();
  await expect(page.getByText(CONSENT_REQUIRED)).toBeVisible();
  expect(await mailCount(request, address)).toBe(0);
});

test('hu01_sc1 signs up with email, verifies it and reaches the donor home', async ({
  page,
  request,
}) => {
  await continueWithEmail(page, email);
  await expect(page).toHaveURL(/code_challenge_method=S256/);
  await expect(page.locator('#email')).toHaveValue(email);
  await submitKeycloakRegistration(page);
  await expect(page.getByText('Verificación del email').first()).toBeVisible();

  await page.goto(await verificationLink(request, email));
  await page.locator('input[name="password-new"]').fill(password);
  await page.locator('input[name="password-confirm"]').fill(password);
  await page.locator('[type="submit"]').click();

  await expectDonorHome(page);
});

test('donor signs in, sees their home and signs out', async ({ page }) => {
  await page.goto('/donor');
  await page.getByRole('main').getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('#username').fill(email);
  // Keycloak may ask for the username and the password on separate screens.
  if (!(await page.locator('#password').isVisible())) await page.locator('[type="submit"]').click();
  await page.locator('#password').fill(password);
  await page.locator('[type="submit"]').click();

  await expectDonorHome(page);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('hu01_sc2 an already registered email suggests sign-in or password recovery', async ({
  page,
}) => {
  await continueWithEmail(page, email);
  await page.locator('#email').fill(email);
  await submitKeycloakRegistration(page);

  await expect(
    page.getByText('Este correo ya está registrado. Inicia sesión o recupera tu contraseña.'),
  ).toBeVisible();
});
