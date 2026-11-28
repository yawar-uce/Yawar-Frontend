// Builds the web app for the desktop client into desktop/dist and records the Keycloak URL it was built with.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build, loadEnv } from 'vite';

const desktop = path.join(import.meta.dirname, '..');
const web = path.join(desktop, '..', 'web');
const dist = path.join(desktop, 'dist');

// Its own PKCE client; every other VITE_* value comes from the environment or web/.env*, as in the web build.
process.env.VITE_KEYCLOAK_CLIENT_ID = 'yawar-desktop';
const env = loadEnv('production', web, 'VITE_');

await build({ root: web, build: { outDir: path.join(dist, 'web'), emptyOutDir: true } });
await mkdir(dist, { recursive: true });
await writeFile(
  path.join(dist, 'config.json'),
  JSON.stringify({ keycloakUrl: env.VITE_KEYCLOAK_URL || 'http://localhost:8080' }),
);
