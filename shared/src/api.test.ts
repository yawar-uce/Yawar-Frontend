import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './api';

function clientReturning(response: Response, token: string | undefined = 'jwt') {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  const client = createApiClient({
    baseUrl: 'http://gateway/',
    getToken: async () => token,
    fetch: fetchMock,
  });
  return { client, fetchMock };
}

function sentHeaders(fetchMock: ReturnType<typeof clientReturning>['fetchMock']) {
  return fetchMock.mock.calls[0][1]?.headers as Headers;
}

describe('createApiClient', () => {
  it('calls the gateway with the bearer token and returns the data', async () => {
    const { client, fetchMock } = clientReturning(Response.json({ id: '1' }));

    const result = await client.request('/api/v1/donors/me');

    expect(fetchMock.mock.calls[0][0]).toBe('http://gateway/api/v1/donors/me');
    expect(sentHeaders(fetchMock).get('Authorization')).toBe('Bearer jwt');
    expect(result).toEqual({ status: 200, data: { id: '1' } });
  });

  it('sends no Authorization header when there is no session', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient({
      baseUrl: 'http://gateway',
      getToken: async () => undefined,
      fetch: fetchMock,
    });

    await client.request('/api/v1/donors');

    expect(sentHeaders(fetchMock).has('Authorization')).toBe(false);
  });

  it('serialises the body and forwards extra headers', async () => {
    const { client, fetchMock } = clientReturning(new Response(null, { status: 202 }));

    await client.request('/api/v1/appointments', {
      method: 'POST',
      body: { slot: 'a' },
      headers: { 'Idempotency-Key': 'key-1' },
    });

    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"slot":"a"}');
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
    expect(sentHeaders(fetchMock).get('Idempotency-Key')).toBe('key-1');
  });

  it('exposes the ETag and the age of degraded data', async () => {
    const { client } = clientReturning(
      Response.json({}, { headers: { ETag: '"3"', 'X-Data-Age': '42' } }),
    );

    const result = await client.request('/api/v1/donors/me');

    expect(result.etag).toBe('"3"');
    expect(result.dataAgeSeconds).toBe(42);
  });

  it('throws the problem detail of a failed request', async () => {
    const { client } = clientReturning(
      new Response(JSON.stringify({ title: 'Not a donor' }), {
        status: 422,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(client.request('/api/v1/donors/me')).rejects.toMatchObject({
      status: 422,
      message: 'Not a donor',
    });
  });

  it('reports an unreachable gateway as status 0', async () => {
    const client = createApiClient({
      baseUrl: 'http://gateway',
      getToken: async () => undefined,
      fetch: vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')),
    });

    await expect(client.request('/api/v1/donors/me')).rejects.toEqual(new ApiError(0));
  });
});
