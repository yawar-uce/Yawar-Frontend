import type { CapacitorConfig } from '@capacitor/cli';

// Passed by scripts/build.mjs. A Keycloak on "localhost" needs no entry (same host name as the app); any other
// host must be listed or Android opens the sign-in page in the browser instead of the app.
const keycloakHost = new URL(process.env.VITE_KEYCLOAK_URL || 'http://localhost:8080').hostname;

const config: CapacitorConfig = {
  appId: 'ec.yawar.mobile',
  appName: 'Yawar',
  webDir: 'dist/web',
  server: {
    // The app is served on http://localhost, the origin registered in the Keycloak client `yawar-mobile`.
    androidScheme: 'http',
    errorPath: 'error.html',
    allowNavigation: keycloakHost === 'localhost' ? [] : [keycloakHost],
  },
};

export default config;
