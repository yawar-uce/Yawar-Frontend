// Builds the web app for the Android client into mobile/dist/web and copies it into the Android project.
import { execFileSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'vite';

const mobile = path.join(import.meta.dirname, '..');
const web = path.join(mobile, '..', 'web');
const outDir = path.join(mobile, 'dist', 'web');

// Its own PKCE client; every other VITE_* value comes from the environment or web/.env*, as in the web build.
process.env.VITE_KEYCLOAK_CLIENT_ID = 'yawar-mobile';
// Android does not let the app answer the redirect into the silent single sign-on frame.
process.env.VITE_SILENT_SSO = 'off';

await build({ root: web, build: { outDir, emptyOutDir: true } });
await copyFile(path.join(mobile, 'static', 'error.html'), path.join(outDir, 'error.html'));

const cli = createRequire(import.meta.url).resolve('@capacitor/cli/package.json');
execFileSync(process.execPath, [path.join(path.dirname(cli), 'bin', 'capacitor'), 'sync', 'android'], {
  cwd: mobile,
  stdio: 'inherit',
});
