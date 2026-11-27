import { effectiveRoles } from '@yawar/shared';
import type Keycloak from 'keycloak-js';
import type { AuthClient, Session } from './AuthClient';
import { saveReturnTo } from './returnTo';

/** Refresh the access token when it expires within this many seconds. */
const MIN_VALIDITY_SECONDS = 30;

/**
 * Authorization Code + PKCE through keycloak-js. Tokens stay in memory: a page reload restores the
 * session from the Keycloak cookie with a silent check, so nothing is written to web storage.
 */
export function createKeycloakAuth(
  keycloak: Keycloak,
  origin: string = window.location.origin,
): AuthClient {
  const listeners = new Set<() => void>();
  let started: Promise<Session | null> | undefined;

  keycloak.onAuthLogout = () => listeners.forEach((listener) => listener());

  async function start(): Promise<Session | null> {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${origin}/silent-check-sso.html`,
      // The fallback would redirect to the current page, which is not a registered redirect URI.
      silentCheckSsoFallback: false,
      checkLoginIframe: false,
    });
    if (!authenticated) return null;

    const claims = keycloak.tokenParsed;
    return {
      name: String(claims?.name || claims?.preferred_username || ''),
      roles: effectiveRoles(keycloak.realmAccess?.roles ?? []),
    };
  }

  /** Remembers where to go back; the sign-in pages are shown in Spanish, like the app. */
  function redirectOptions(returnTo: string) {
    saveReturnTo(returnTo);
    return { redirectUri: `${origin}/callback`, locale: 'es' };
  }

  return {
    // keycloak-js accepts a single init call, and React Strict Mode runs effects twice.
    init: () => (started ??= start()),
    login: (returnTo) => keycloak.login(redirectOptions(returnTo)),
    register: (returnTo, email) =>
      keycloak.register({ ...redirectOptions(returnTo), loginHint: email }),
    loginWithGoogle: (returnTo) =>
      keycloak.login({ ...redirectOptions(returnTo), idpHint: 'google' }),
    logout: () => keycloak.logout({ redirectUri: `${origin}/` }),
    async getToken() {
      if (!keycloak.authenticated) return undefined;
      try {
        await keycloak.updateToken(MIN_VALIDITY_SECONDS);
      } catch {
        // keycloak-js ends the session itself when the refresh token is rejected.
        return undefined;
      }
      return keycloak.token;
    },
    onSessionEnd(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
