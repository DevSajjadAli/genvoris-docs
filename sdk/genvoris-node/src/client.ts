/**
 * Low-level HTTP client. Handles:
 *   - Auth header injection
 *   - Timeouts via AbortController
 *   - Exponential-backoff retries for 429 / 5xx and transient network errors
 *   - JSON encode/decode + typed error surfacing
 *
 * The retry schedule is 200 ms / 800 ms / 3200 ms (with +/-30% jitter)
 * for up to `maxRetries` attempts. We do NOT retry 4xx other than 429
 * because those are not transient.
 */

import {
  ClientOptions,
  ListResult,
  PaginationParams,
} from './types';
import {
  GenvorisAPIError,
  GenvorisAuthError,
  GenvorisError,
} from './errors';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Override per-request timeout. */
  timeoutMs?: number;
  /** Override per-request retry count. */
  maxRetries?: number;
}

const DEFAULT_BASE_URL = 'https://api.genvoris.org';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 200;

function jitter(ms: number): number {
  const delta = ms * 0.3;
  return ms + (Math.random() * 2 - 1) * delta;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(opts: ClientOptions) {
    if (!opts.apiKey || typeof opts.apiKey !== 'string') {
      throw new GenvorisAuthError('apiKey is required.');
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    const userFetch = opts.fetch;
    const globalFetch = (globalThis as { fetch?: typeof fetch }).fetch;
    if (!userFetch && !globalFetch) {
      throw new GenvorisError(
        'No fetch implementation found. Pass `fetch` in ClientOptions, or use Node >= 18.',
        'no_fetch',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fetchImpl = (userFetch ?? globalFetch)!;
    this.defaultHeaders = opts.defaultHeaders ?? {};
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const maxRetries = opts.maxRetries ?? this.maxRetries;
    const timeoutMs = opts.timeoutMs ?? this.timeoutMs;

    let attempt = 0;
    let lastErr: unknown;

    // attempt-loop: attempt 0 is the original call, 1..maxRetries are retries.
    while (attempt <= maxRetries) {
      try {
        return await this.executeOnce<T>(opts, timeoutMs);
      } catch (err) {
        lastErr = err;
        if (!this.shouldRetry(err) || attempt === maxRetries) throw err;
        const delay = jitter(BACKOFF_BASE_MS * 4 ** attempt);
        await sleep(delay);
        attempt += 1;
      }
    }
    // unreachable but keeps the type checker happy
    throw lastErr;
  }

  private shouldRetry(err: unknown): boolean {
    if (err instanceof GenvorisAPIError) {
      return err.status === 429 || (err.status >= 500 && err.status < 600);
    }
    // Network / abort / DNS errors are not GenvorisAPIError -- retry them.
    return true;
  }

  private async executeOnce<T>(opts: RequestOptions, timeoutMs: number): Promise<T> {
    const url = this.buildUrl(opts.path, opts.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': '@genvoris/node/1.0.0',
      ...this.defaultHeaders,
    };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: opts.method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const requestId = res.headers.get('x-request-id') ?? undefined;

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // Body wasn't JSON; surface as raw.
      }
    }

    if (!res.ok) {
      const message =
        (json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
          ? (json as { error: string }).error
          : null) ??
        (json && typeof json === 'object' && 'message' in json && typeof (json as { message: unknown }).message === 'string'
          ? (json as { message: string }).message
          : null) ??
        `HTTP ${res.status}`;
      const code =
        json && typeof json === 'object' && 'code' in json && typeof (json as { code: unknown }).code === 'string'
          ? (json as { code: string }).code
          : undefined;

      if (res.status === 401 || res.status === 403) {
        throw new GenvorisAuthError(message);
      }
      throw new GenvorisAPIError({
        message,
        status: res.status,
        code,
        requestId,
        raw: json ?? text,
      });
    }

    return (json ?? (undefined as unknown)) as T;
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    const u = new URL(this.baseUrl + cleaned);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        u.searchParams.set(k, String(v));
      }
    }
    return u.toString();
  }
}

/** Helper: merge pagination params into a query bag. */
export function paginationToQuery(p?: PaginationParams): Record<string, number> {
  const q: Record<string, number> = {};
  if (p?.page) q.page = p.page;
  if (p?.limit) q.limit = p.limit;
  return q;
}

/** Re-export so resource files only need one import. */
export type { ListResult };
