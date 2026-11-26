const env = import.meta.env;

/** Local defaults; each environment sets the VITE_* variables at build time (see .env.example). */
export const keycloakConfig = {
  url: env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: env.VITE_KEYCLOAK_REALM || 'yawar-dev',
  clientId: env.VITE_KEYCLOAK_CLIENT_ID || 'yawar-web',
};
