const env = import.meta.env;

/** Local defaults; each environment sets the VITE_* variables at build time (see .env.example). */
/** API Gateway origin: the only backend address the app calls. */
export const apiUrl = env.VITE_API_URL || 'http://localhost:8000';

/** `off` in the Android build, whose WebView cannot load the redirect into the silent-check frame. */
export const silentSso = env.VITE_SILENT_SSO !== 'off';

export const keycloakConfig = {
  url: env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: env.VITE_KEYCLOAK_REALM || 'yawar-dev',
  clientId: env.VITE_KEYCLOAK_CLIENT_ID || 'yawar-web',
};
