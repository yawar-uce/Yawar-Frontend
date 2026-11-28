// Electron main process: serves the web build on a fixed loopback port and shows it in one window.
// The app itself (screens, sign-in, API calls) is the web build; nothing is duplicated here.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { app, BrowserWindow, dialog, Menu, session, shell } from 'electron';
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

function goHome(window) {
  window?.loadURL(`${ORIGIN}/`);
}

/** Spanish menu; "Volver al inicio" is the way back from a sign-in page. */
function createMenu() {
  const item = (role, label) => ({ role, label });
  return Menu.buildFromTemplate([
    {
      label: 'Yawar',
      submenu: [
        {
          id: 'home',
          label: 'Volver al inicio',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => goHome(BrowserWindow.getAllWindows()[0]),
        },
        item('reload', 'Recargar'),
        { type: 'separator' },
        item('quit', 'Salir'),
      ],
    },
    {
      label: 'Editar',
      submenu: [
        item('undo', 'Deshacer'),
        item('redo', 'Rehacer'),
        { type: 'separator' },
        item('cut', 'Cortar'),
        item('copy', 'Copiar'),
        item('paste', 'Pegar'),
        item('selectAll', 'Seleccionar todo'),
      ],
    },
    {
      label: 'Ver',
      submenu: [
        item('zoomIn', 'Acercar'),
        item('zoomOut', 'Alejar'),
        item('resetZoom', 'Tamaño real'),
        item('togglefullscreen', 'Pantalla completa'),
      ],
    },
  ]);
}

/** A page that cannot load (Keycloak unreachable, no network) offers the way back to the app. */
function offerWayBack(window) {
  window.webContents.on('did-fail-load', async (_event, code, _description, _url, isMainFrame) => {
    const aborted = -3; // a newer navigation, or one refused by the guard
    if (!isMainFrame || code === aborted) return;
    await dialog.showMessageBox(window, {
      type: 'error',
      title: 'Yawar',
      message: 'No se pudo abrir la página. Revisa tu conexión e inténtalo de nuevo.',
      buttons: ['Volver al inicio'],
    });
    goHome(window);
  });
}

function createWindow(policy) {
  const window = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    title: 'Yawar',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Chromium's spellchecker downloads dictionaries from a Google server on some systems.
      spellcheck: false,
    },
  });
  guard(window.webContents, policy);
  offerWayBack(window);
  goHome(window);
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
  session.defaultSession.setSpellCheckerEnabled(false);
  Menu.setApplicationMenu(createMenu());

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
    // EACCES: Windows reserved the port (for example for Hyper-V).
    const message =
      error.code === 'EADDRINUSE' || error.code === 'EACCES'
        ? `Yawar no puede usar el puerto ${PORT}. Cierra el programa que lo ocupa o reinicia el equipo.`
        : 'Yawar no pudo iniciarse. Vuelve a instalar la aplicación.';
    console.error(error);
    dialog.showErrorBox('Yawar', message);
    app.exit(1);
  });
} else {
  app.quit();
}
