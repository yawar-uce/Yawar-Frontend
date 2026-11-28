import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveFile, startServer } from './server.js';

let base;
let root;

beforeAll(async () => {
  base = await mkdtemp(path.join(tmpdir(), 'yawar-desktop-'));
  root = path.join(base, 'web');
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<title>Yawar</title>');
  await writeFile(path.join(root, 'assets', 'app.js'), 'export {};');
  await writeFile(path.join(base, 'secret.txt'), 'outside the web build');
});

afterAll(() => rm(base, { recursive: true, force: true }));

describe('resolveFile', () => {
  it('returns the requested file, ignoring the query', async () => {
    expect(await resolveFile(root, '/assets/app.js?v=1')).toBe(path.join(root, 'assets', 'app.js'));
  });

  it.each(['/', '/callback?code=abc', '/donor'])(
    'serves index.html for the route %s',
    async (url) => {
      expect(await resolveFile(root, url)).toBe(path.join(root, 'index.html'));
    },
  );

  it.each([
    '/assets/missing.js',
    '/../secret.txt',
    '/%2e%2e/secret.txt',
    '/..%2fsecret.txt',
    '/%00',
    '/%E0%A4%A',
  ])('refuses %s', async (url) => {
    expect(await resolveFile(root, url)).toBeNull();
  });
});

describe('startServer', () => {
  async function freePort() {
    const probe = createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const { port } = probe.address();
    await new Promise((resolve) => probe.close(resolve));
    return port;
  }

  function get(port, url, { method = 'GET', host = `localhost:${port}` } = {}) {
    return new Promise((resolve, reject) => {
      const options = { host: '127.0.0.1', port, path: url, method, headers: { host } };
      request(options, (response) => {
        let body = '';
        response.on('data', (chunk) => (body += chunk));
        response.on('end', () =>
          resolve({ status: response.statusCode, headers: response.headers, body }),
        );
      })
        .on('error', reject)
        .end();
    });
  }

  it('serves the build to localhost only, with GET and HEAD', async () => {
    const port = await freePort();
    const server = await startServer(root, port);
    try {
      const page = await get(port, '/callback');
      expect(page).toMatchObject({ status: 200, body: '<title>Yawar</title>' });
      expect(page.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(page.headers['x-content-type-options']).toBe('nosniff');
      const script = await get(port, '/assets/app.js');
      expect(script.headers['content-type']).toContain('text/javascript');
      expect(await get(port, '/', { method: 'HEAD' })).toMatchObject({ status: 200, body: '' });
      expect((await get(port, '/', { method: 'POST' })).status).toBe(405);
      expect((await get(port, '/missing.png')).status).toBe(404);
      expect((await get(port, '/', { host: `evil.example:${port}` })).status).toBe(421);
    } finally {
      await server.close();
    }
  });

  it('fails when another program already uses the port', async () => {
    const port = await freePort();
    const other = createServer();
    await new Promise((resolve) => other.listen(port, '127.0.0.1', resolve));
    try {
      await expect(startServer(root, port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
    } finally {
      await new Promise((resolve) => other.close(resolve));
    }
  });

  it('fails when any address other than a missing ::1 cannot be bound', async () => {
    const port = await freePort();
    // 192.0.2.1 belongs to the documentation range, so no computer has it.
    await expect(startServer(root, port, ['127.0.0.1', '192.0.2.1'])).rejects.toMatchObject({
      code: 'EADDRNOTAVAIL',
    });
    // The first address was released again.
    const server = await startServer(root, port, ['127.0.0.1']);
    await server.close();
  });
});
