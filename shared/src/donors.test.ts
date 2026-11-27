import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './api';
import { getMyDonorProfile } from './donors';

describe('getMyDonorProfile', () => {
  it('reads the own profile through the gateway', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: '1' }));
    const api = createApiClient({
      baseUrl: 'http://gateway',
      getToken: async () => 'jwt',
      fetch: fetchMock,
    });

    const result = await getMyDonorProfile(api);

    expect(fetchMock.mock.calls[0][0]).toBe('http://gateway/api/v1/donors/me');
    expect(result.data).toEqual({ id: '1' });
  });
});
