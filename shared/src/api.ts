/** RFC 9457 error body returned by the gateway and the services. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

export interface ApiClientOptions {
  /** API Gateway origin. Clients never call a microservice directly. */
  baseUrl: string;
  getToken: () => Promise<string | undefined>;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Extra headers, e.g. Idempotency-Key or If-Match. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
  etag?: string;
  /** Present when the gateway serves degraded (cached) data. */
  dataAgeSeconds?: number;
}

/** Failed request; status 0 means the gateway could not be reached. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetail;

  constructor(status: number, problem?: ProblemDetail) {
    super(problem?.title ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export function createApiClient({
  baseUrl,
  getToken,
  fetch: doFetch = (input, init) => fetch(input, init),
  timeoutMs = 10_000,
}: ApiClientOptions) {
  const root = baseUrl.replace(/\/+$/, '');

  return {
    async request<T>(path: `/${string}`, options: RequestOptions = {}): Promise<ApiResponse<T>> {
      const { method = 'GET', body, signal } = options;
      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      const token = await getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      let response: Response;
      try {
        response = await doFetch(`${root}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: signal ?? AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw new ApiError(0);
      }

      const isJson = response.headers.get('Content-Type')?.includes('json') ?? false;
      const data: unknown = isJson ? await response.json().catch(() => undefined) : undefined;
      if (!response.ok) throw new ApiError(response.status, data as ProblemDetail | undefined);

      const age = response.headers.get('X-Data-Age');
      return {
        status: response.status,
        data: data as T,
        etag: response.headers.get('ETag') ?? undefined,
        dataAgeSeconds: age === null ? undefined : Number(age),
      };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
