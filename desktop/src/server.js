import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/** Both loopback addresses `localhost` can resolve to, so no other program can answer on either one. */
const LOOPBACK_HOSTS = ['127.0.0.1', '::1'];

const isFile = (file) =>
  stat(file).then(
    (stats) => stats.isFile(),
    () => false,
  );

/**
 * File of the web build that answers a request path. Paths without an extension are client-side routes
 * (such as `/callback`) and get `index.html`. Returns null for anything else, including paths that would
 * leave `root`.
 */
export async function resolveFile(root, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;

  const base = path.resolve(root);
  const file = path.join(base, pathname);
  if (file !== path.join(base, '/') && file !== base && !file.startsWith(base + path.sep)) {
    return null;
  }
  if (await isFile(file)) return file;
  return path.extname(pathname) ? null : path.join(base, 'index.html');
}

function handler(root, port) {
  return async (request, response) => {
    const send = (status, headers = {}, body = undefined) => {
      response.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
      response.end(body);
    };
    // Refuses other host names pointed at the loopback address (DNS rebinding).
    if (request.headers.host !== `localhost:${port}`) return send(421);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return send(405, { Allow: 'GET, HEAD' });
    }

    const file = await resolveFile(root, request.url);
    if (!file) return send(404);
    try {
      const body = await readFile(file);
      const headers = {
        'Content-Type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-cache',
      };
      return send(200, headers, request.method === 'HEAD' ? undefined : body);
    } catch {
      return send(500);
    }
  };
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

const close = (server) => new Promise((resolve) => server.close(resolve));

/**
 * Serves the web build in `root` on http://localhost:`port`, reachable from this computer only. Rejects
 * when the port is taken on any loopback address.
 */
export async function startServer(root, port, hosts = LOOPBACK_HOSTS) {
  const servers = [];
  const stop = () => Promise.all(servers.map(close));
  for (const host of hosts) {
    try {
      servers.push(await listen(createServer(handler(root, port)), port, host));
    } catch (error) {
      // A computer without IPv6 has no ::1 to protect.
      if (host === '::1' && ['EADDRNOTAVAIL', 'EAFNOSUPPORT'].includes(error.code)) continue;
      await stop();
      throw error;
    }
  }
  return { close: stop };
}
