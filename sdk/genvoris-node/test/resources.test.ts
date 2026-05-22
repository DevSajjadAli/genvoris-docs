import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenvorisClient } from '../src';

interface CallSnapshot {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Mock fetch that records every call and returns the next pre-queued response.
 */
function buildFetch(
  responses: Array<{ status?: number; jsonBody?: unknown }>,
): { fn: ReturnType<typeof vi.fn>; calls: CallSnapshot[] } {
  const calls: CallSnapshot[] = [];
  let i = 0;
  const fn = vi.fn(async (input: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    calls.push({
      url: input,
      method: init.method ?? 'GET',
      headers,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    const bodyText = r.jsonBody !== undefined ? JSON.stringify(r.jsonBody) : '';
    return {
      ok: (r.status ?? 200) < 400,
      status: r.status ?? 200,
      headers: new Headers(),
      text: async () => bodyText,
    } as unknown as Response;
  });
  return { fn, calls };
}

function client(fetchFn: ReturnType<typeof vi.fn>): GenvorisClient {
  return new GenvorisClient({
    apiKey: 'gvk_test_xxx',
    fetch: fetchFn as unknown as typeof fetch,
    baseUrl: 'https://api.example.test',
    maxRetries: 0,
  });
}

describe('Resource → endpoint mapping', () => {
  let f: ReturnType<typeof buildFetch>;
  beforeEach(() => {
    f = buildFetch([{ status: 200, jsonBody: { ok: true } }]);
  });

  describe('customers', () => {
    it('list → GET /api/v1/customers', async () => {
      await client(f.fn).customers.list({ page: 2, limit: 50 });
      expect(f.calls[0].method).toBe('GET');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/customers?page=2&limit=50');
    });

    it('retrieve → GET /api/v1/customers/:id (encoded)', async () => {
      await client(f.fn).customers.retrieve('cus_1/abc');
      expect(f.calls[0].method).toBe('GET');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/customers/cus_1%2Fabc');
    });

    it('create → POST /api/v1/customers with JSON body', async () => {
      await client(f.fn).customers.create({ externalId: 'user_1', email: 'a@b.test' });
      expect(f.calls[0].method).toBe('POST');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/customers');
      expect(f.calls[0].body).toEqual({ externalId: 'user_1', email: 'a@b.test' });
      expect(f.calls[0].headers['Content-Type']).toBe('application/json');
    });

    it('update → PATCH /api/v1/customers/:id', async () => {
      await client(f.fn).customers.update('cus_1', { email: 'new@b.test' });
      expect(f.calls[0].method).toBe('PATCH');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/customers/cus_1');
      expect(f.calls[0].body).toEqual({ email: 'new@b.test' });
    });

    it('delete → DELETE /api/v1/customers/:id', async () => {
      await client(f.fn).customers.delete('cus_1');
      expect(f.calls[0].method).toBe('DELETE');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/customers/cus_1');
    });
  });

  describe('plans', () => {
    it('list → GET /api/v1/plans', async () => {
      await client(f.fn).plans.list();
      expect(f.calls[0].method).toBe('GET');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/plans');
    });

    it('create → POST /api/v1/plans', async () => {
      await client(f.fn).plans.create({ name: 'Pro', monthlyQuota: 1000 });
      expect(f.calls[0].method).toBe('POST');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/plans');
      expect(f.calls[0].body).toEqual({ name: 'Pro', monthlyQuota: 1000 });
    });
  });

  describe('sessions', () => {
    it('mint → POST /api/v1/sessions', async () => {
      await client(f.fn).sessions.mint({ externalId: 'user_1' });
      expect(f.calls[0].method).toBe('POST');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/sessions');
      expect(f.calls[0].body).toEqual({ externalId: 'user_1' });
    });
  });

  describe('tryon', () => {
    it('analyze → POST /api/v1/tryon/analyze', async () => {
      await client(f.fn).tryon.analyze({ productImages: ['https://x/y.jpg'] });
      expect(f.calls[0].method).toBe('POST');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/tryon/analyze');
    });

    it('generate → POST /api/v1/tryon/generate', async () => {
      await client(f.fn).tryon.generate({ sessionToken: 'tk_1', userImage: 'data:image/jpeg;base64,zzz' });
      expect(f.calls[0].method).toBe('POST');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/tryon/generate');
    });

    it('status → GET /api/v1/tryon/:id', async () => {
      await client(f.fn).tryon.status('try_1');
      expect(f.calls[0].method).toBe('GET');
      expect(f.calls[0].url).toBe('https://api.example.test/api/v1/tryon/try_1');
    });
  });

  describe('common headers', () => {
    it('every request carries Bearer auth + User-Agent', async () => {
      await client(f.fn).customers.list();
      const h = f.calls[0].headers;
      expect(h.Authorization).toBe('Bearer gvk_test_xxx');
      expect(h['User-Agent']).toMatch(/^@genvoris\/node\//);
      expect(h.Accept).toBe('application/json');
    });

    it('GET requests do NOT set Content-Type', async () => {
      await client(f.fn).customers.list();
      const h = f.calls[0].headers;
      expect(h['Content-Type']).toBeUndefined();
    });
  });
});
