import type Keycloak from 'keycloak-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createKeycloakAuth } from './keycloakAuth';
import { readReturnTo, saveReturnTo } from './returnTo';

function fakeKeycloak(overrides: Record<string, unknown> = {}) {
  return {
    authenticated: true,
    token: 'jwt',
    tokenParsed: { name: 'Ana Torres' },
    realmAccess: { roles: ['donor', 'uma_authorization'] },
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    updateToken: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function authFor(keycloak: ReturnType<typeof fakeKeycloak>) {
  return createKeycloakAuth(keycloak as unknown as Keycloak, 'http://app');
}

beforeEach(() => sessionStorage.clear());

describe('createKeycloakAuth', () => {
  it('starts once with PKCE S256 and returns the session', async () => {
    const keycloak = fakeKeycloak();
    const auth = authFor(keycloak);

    const [first, second] = await Promise.all([auth.init(), auth.init()]);

    expect(keycloak.init).toHaveBeenCalledTimes(1);
    expect(keycloak.init).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: 'check-sso', pkceMethod: 'S256' }),
    );
    expect(first).toEqual({ name: 'Ana Torres', roles: ['donor'] });
    expect(second).toBe(first);
  });

  it('returns no session for an anonymous visitor', async () => {
    const auth = authFor(fakeKeycloak({ init: vi.fn().mockResolvedValue(false) }));

    await expect(auth.init()).resolves.toBeNull();
  });

  it('falls back to the username and no roles when claims are missing', async () => {
    const auth = authFor(
      fakeKeycloak({ tokenParsed: { preferred_username: 'ana' }, realmAccess: undefined }),
    );

    await expect(auth.init()).resolves.toEqual({ name: 'ana', roles: [] });
  });

  it('logs in through /callback and remembers the requested page', async () => {
    const keycloak = fakeKeycloak();

    await authFor(keycloak).login('/donor');

    expect(keycloak.login).toHaveBeenCalledWith({
      redirectUri: 'http://app/callback',
      locale: 'es',
    });
    expect(readReturnTo()).toBe('/donor');
  });

  it('opens the sign-up form with the typed email', async () => {
    const keycloak = fakeKeycloak();

    await authFor(keycloak).register('/donor', 'ana@example.test');

    expect(keycloak.register).toHaveBeenCalledWith({
      redirectUri: 'http://app/callback',
      locale: 'es',
      loginHint: 'ana@example.test',
    });
    expect(readReturnTo()).toBe('/donor');
  });

  it('goes straight to Google', async () => {
    const keycloak = fakeKeycloak();

    await authFor(keycloak).loginWithGoogle('/donor');

    expect(keycloak.login).toHaveBeenCalledWith({
      redirectUri: 'http://app/callback',
      locale: 'es',
      idpHint: 'google',
    });
  });

  it('logs out back to the landing page', async () => {
    const keycloak = fakeKeycloak();

    await authFor(keycloak).logout();

    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: 'http://app/' });
  });

  it('refreshes the token before handing it out', async () => {
    const keycloak = fakeKeycloak();

    await expect(authFor(keycloak).getToken()).resolves.toBe('jwt');
    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
  });

  it('gives no token without a session or when the refresh fails', async () => {
    const anonymous = authFor(fakeKeycloak({ authenticated: false }));
    const expired = authFor(fakeKeycloak({ updateToken: vi.fn().mockRejectedValue(new Error()) }));

    await expect(anonymous.getToken()).resolves.toBeUndefined();
    await expect(expired.getToken()).resolves.toBeUndefined();
  });

  it('notifies subscribers when Keycloak ends the session', () => {
    const keycloak = fakeKeycloak() as ReturnType<typeof fakeKeycloak> & {
      onAuthLogout?: () => void;
    };
    const listener = vi.fn();
    const unsubscribe = authFor(keycloak).onSessionEnd(listener);

    keycloak.onAuthLogout?.();
    unsubscribe();
    keycloak.onAuthLogout?.();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('readReturnTo', () => {
  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/callback'])(
    'ignores %s',
    (path) => {
      saveReturnTo(path);

      expect(readReturnTo()).toBe('/');
    },
  );
});
