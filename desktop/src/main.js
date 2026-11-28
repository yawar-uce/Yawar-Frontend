// Electron main process: serves the web build on a fixed loopback port and shows it in one window.
// The app itself (screens, sign-in, API calls) is the web build; nothing is duplicated here.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { app, BrowserWindow, dialog, session, shell } from 'electron';
import { createNavigationPolicy } from './navigation.js';
import { startServer } from './server.js';

/** Registered in the Keycloak client `yawar-desktop`; changing it requires changing the realm. */
const PORT = 5180;
const ORIGIN = `http://localhost:${PORT}`;
const dist = path.join(import.meta.dirname, '..', 'dist');

function guard(contents, policy) {
  const openOutside = (url) => {
    if (policy.isWebLink(url)) shell.openExternal(url);
  };
  const keepInside = (details) => {
    if (!details.isMainFrame || policy.staysInWindow(details.url)) return;
    details.preventDefault();
    openOutside(details.url);
  };
  contents.on('will-navigate', keepInside);
  contents.on('will-redirect', keepInside);
  contents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
}

function createWindow(policy) {
  const window = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    title: 'Yawar',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  guard(window.webContents, policy);
  window.loadURL(`${ORIGIN}/`);
}

async function start() {
  await app.whenReady();
  // Written by scripts/build.mjs with the same Keycloak URL compiled into the web build.
  const { keycloakUrl } = JSON.parse(readFileSync(path.join(dist, 'config.json'), 'utf8'));
  const policy = createNavigationPolicy(ORIGIN, keycloakUrl);

  // The app needs no device permissions (camera, location, notifications...).
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, allow) =>
    allow(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);

  await startServer(path.join(dist, 'web'), PORT);
  createWindow(policy);

  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(policy);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

if (app.requestSingleInstanceLock()) {
  start().catch((error) => {
    const message =
      error.code === 'EADDRINUSE'
        ? `Yawar necesita el puerto ${PORT} y otro programa lo está usando. Ciérralo y vuelve a abrir Yawar.`
        : 'Yawar no pudo iniciarse. Vuelve a instalar la aplicación.';
    console.error(error);
    dialog.showErrorBox('Yawar', message);
    app.exit(1);
  });
} else {
  app.quit();
}
