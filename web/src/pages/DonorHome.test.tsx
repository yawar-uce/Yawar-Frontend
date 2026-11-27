import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient } from '@yawar/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiContext } from '../api/context';
import { AuthContext, type AuthContextValue } from '../auth/context';
import { DonorHome } from './DonorHome';

const profile = {
  id: '1',
  profileComplete: false,
  consents: [
    { purpose: 'DATA_PROCESSING', policyVersion: '2026-1', grantedAt: '2026-11-26T12:00:00Z' },
  ],
};

function renderHome(respond: () => Response) {
  const fetchMock = vi.fn<typeof fetch>(async () => respond());
  const api = createApiClient({
    baseUrl: 'http://gateway',
    getToken: async () => 'jwt',
    fetch: fetchMock,
  });
  const auth: AuthContextValue = {
    state: { status: 'authenticated', session: { name: 'Ana Torres', roles: ['donor'] } },
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
  };
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })}
    >
      <AuthContext.Provider value={auth}>
        <ApiContext.Provider value={api}>
          <DonorHome />
        </ApiContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { auth, fetchMock };
}

const alertText = async () => (await screen.findByRole('alert')).textContent;

afterEach(cleanup);

describe('DonorHome', () => {
  it('shows the active consents and a non-blocking incomplete profile notice', async () => {
    renderHome(() => Response.json(profile));

    expect(screen.getByRole('status').textContent).toBe('Cargando tu perfil…');
    expect((await screen.findByRole('listitem')).textContent).toContain(
      'Tratamiento de datos personales: política 2026-1',
    );
    expect(screen.getByText(/Tu perfil está incompleto/)).toBeDefined();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('hides the notice for a complete profile and tells the age of degraded data', async () => {
    renderHome(() =>
      Response.json({ ...profile, profileComplete: true }, { headers: { 'X-Data-Age': '30' } }),
    );

    expect(await screen.findByText('Actualizado hace 30 s.')).toBeDefined();
    expect(screen.queryByText(/Tu perfil está incompleto/)).toBeNull();
  });

  it('retries once and offers a manual retry when the service is down', async () => {
    const { fetchMock } = renderHome(() => new Response(null, { status: 503 }));

    expect(await alertText()).toContain('no está disponible');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(2));
  });

  it.each([
    [403, 'no tiene acceso'],
    [422, 'No tenemos tu consentimiento'],
  ])('explains a %i without retrying', async (status, text) => {
    const { fetchMock } = renderHome(() => new Response(null, { status }));

    expect(await alertText()).toContain(text);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('asks to sign in again when the token is refused', async () => {
    const { auth } = renderHome(() => new Response(null, { status: 401 }));

    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar de nuevo' }));

    expect(auth.login).toHaveBeenCalledWith('/donor');
  });

  it('explains the rate limit', async () => {
    renderHome(() => new Response(null, { status: 429 }));

    expect(await alertText()).toContain('demasiadas solicitudes');
  });
});
