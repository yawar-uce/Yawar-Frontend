/** Google's sign-in page, reached through Keycloak when the user picks "Continuar con Google". */
const GOOGLE_ORIGIN = 'https://accounts.google.com';

function parse(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Which addresses the app window may show: the app itself and the sign-in pages. */
export function createNavigationPolicy(appOrigin, keycloakUrl) {
  const allowed = new Set([appOrigin, new URL(keycloakUrl).origin, GOOGLE_ORIGIN]);
  return {
    staysInWindow: (url) => allowed.has(parse(url)?.origin),
    /** Only web links go to the system browser; never `file:`, `javascript:` or custom protocols. */
    isWebLink: (url) => ['http:', 'https:'].includes(parse(url)?.protocol),
  };
}
