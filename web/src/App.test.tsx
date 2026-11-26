import type { Role } from '@yawar/shared';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { AuthClient, Session } from './auth/AuthClient';
import { AuthProvider } from './auth/AuthProvider';
import { saveReturnTo } from './auth/returnTo';

function renderApp(path: string, init: () => Promise<Session | null>) {
  let endSession = () => {};
  const client: AuthClient = {
    init,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getToken: vi.fn(),
    onSessionEnd: (listener) => {
      endSession = listener;
      return () => {};
    },
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider client={client}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { client, endSession: () => act(() => endSession()) };
}

const signedIn = (...roles: Role[]) => async () => ({ name: 'Ana Torres', roles });
const anonymous = async () => null;
const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

describe('App', () => {
  it('shows a loading status while the session is checked', () => {
    renderApp('/', () => new Promise(() => {}));

    expect(screen.getByRole('status').textContent).toBe('Cargando…');
  });

  it('explains that the identity service is unreachable', async () => {
    renderApp('/', () => Promise.reject(new Error('down')));

    expect(await screen.findByRole('alert')).toBeDefined();
  });

  it('asks an anonymous visitor to sign in and keeps the requested page', async () => {
    const { client } = renderApp('/donor', anonymous);
    await heading('Inicia sesión para continuar');

    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' })[1]);

    expect(client.login).toHaveBeenCalledWith('/donor');
  });

  it('signs in from the header', async () => {
    const { client } = renderApp('/', anonymous);

    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));

    expect(client.login).toHaveBeenCalledWith('/');
  });

  it('lets a donor into the donor portal and sign out', async () => {
    const { client } = renderApp('/donor', signedIn('donor'));
    await heading('Portal del donante');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(client.logout).toHaveBeenCalled();
  });

  it.each([
    ['/donor', 'logistics'],
    ['/staff', 'donor'],
  ] as const)('denies %s to the %s role', async (path, role) => {
    renderApp(path, signedIn(role));

    expect(await heading('Acceso no autorizado')).toBeDefined();
  });

  it('lets staff into the staff portal', async () => {
    renderApp('/staff', signedIn('auditor'));

    expect(await heading('Portal del personal')).toBeDefined();
  });

  it.each([
    ['donor', 'Ir a mi portal de donante'],
    ['hospital', 'Ir al portal del personal'],
  ] as const)('links a %s to their portal', async (role, label) => {
    renderApp('/', signedIn(role));

    expect(await screen.findByRole('link', { name: label })).toBeDefined();
  });

  it('returns to the requested page after the login redirect', async () => {
    saveReturnTo('/donor');
    renderApp('/callback', signedIn('donor'));

    expect(await heading('Portal del donante')).toBeDefined();
  });

  it('closes the protected page when the session ends', async () => {
    const { endSession } = renderApp('/donor', signedIn('donor'));
    await heading('Portal del donante');

    endSession();

    expect(await heading('Inicia sesión para continuar')).toBeDefined();
  });

  it('shows a not found page for unknown routes', async () => {
    renderApp('/nope', anonymous);

    expect(await heading('Página no encontrada')).toBeDefined();
  });
});
