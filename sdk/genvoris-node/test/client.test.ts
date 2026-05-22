import { describe, it, expect, vi } from 'vitest';
import { GenvorisClient, GenvorisAPIError, GenvorisAuthError } from '../src';

function mockFetch(responses: Array<Partial<Response> & { jsonBody?: unknown; textBody?: string }>) {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    const bodyText = r.textBody ?? (r.jsonBody !== undefined ? JSON.stringify(r.jsonBody) : '');
    return {
      ok: (r.status ?? 200) < 400,
      status: r.status ?? 200,
      headers: new Headers(r.headers as HeadersInit | undefined),
      text: async () => bodyText,
    } as unknown as Response;
  });
}

describe('HttpClient (via GenvorisClient)', () => {
  it('attaches Authorization header', async () => {
    const fetchImpl = mockFetch([{ status: 200, jsonBody: { data: [], page: 1, limit: 25, total: 0 } }]);
    const gv = new GenvorisClient({ apiKey: 'gvk_test_xxx', fetch: fetchImpl as unknown as typeof fetch });
    await gv.customers.list();
    const headers = (fetchImpl.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer gvk_test_xxx');
  });

  it('retries on 503 then succeeds', async () => {
    const fetchImpl = mockFetch([
      { status: 503, textBody: 'upstream busy' },
      { status: 200, jsonBody: { data: [], page: 1, limit: 25, total: 0 } },
    ]);
    const gv = new GenvorisClient({
      apiKey: 'gvk_test_xxx',
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 2,
    });
    await gv.customers.list();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 400', async () => {
    const fetchImpl = mockFetch([{ status: 400, jsonBody: { error: 'bad_request' } }]);
    const gv = new GenvorisClient({
      apiKey: 'gvk_test_xxx',
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 3,
    });
    await expect(gv.customers.list()).rejects.toBeInstanceOf(GenvorisAPIError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws GenvorisAuthError on 401', async () => {
    const fetchImpl = mockFetch([{ status: 401, jsonBody: { error: 'invalid_key' } }]);
    const gv = new GenvorisClient({
      apiKey: 'gvk_test_xxx',
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 0,
    });
    await expect(gv.customers.list()).rejects.toBeInstanceOf(GenvorisAuthError);
  });

  it('rejects empty apiKey at construction', () => {
    expect(
      () => new GenvorisClient({ apiKey: '', fetch: globalThis.fetch }),
    ).toThrow(GenvorisAuthError);
  });
});
