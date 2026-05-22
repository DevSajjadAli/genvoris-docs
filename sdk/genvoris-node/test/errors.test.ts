import { describe, it, expect } from 'vitest';
import {
  GenvorisError,
  GenvorisAuthError,
  GenvorisAPIError,
  GenvorisWebhookError,
} from '../src/errors';

describe('Error hierarchy', () => {
  it('GenvorisError carries a default code', () => {
    const e = new GenvorisError('boom');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('GenvorisError');
    expect(e.code).toBe('genvoris_error');
    expect(e.message).toBe('boom');
  });

  it('GenvorisError accepts a custom code', () => {
    const e = new GenvorisError('boom', 'custom_code');
    expect(e.code).toBe('custom_code');
  });

  it('GenvorisAuthError defaults message + code', () => {
    const e = new GenvorisAuthError();
    expect(e).toBeInstanceOf(GenvorisError);
    expect(e.name).toBe('GenvorisAuthError');
    expect(e.code).toBe('auth_error');
    expect(e.message).toBe('Invalid or missing API key.');
  });

  it('GenvorisAPIError exposes status / requestId / raw', () => {
    const e = new GenvorisAPIError({
      message: 'Bad Request',
      status: 400,
      requestId: 'req_123',
      raw: { error: 'bad_request', extra: 'context' },
    });
    expect(e).toBeInstanceOf(GenvorisError);
    expect(e.name).toBe('GenvorisAPIError');
    expect(e.status).toBe(400);
    expect(e.requestId).toBe('req_123');
    expect(e.code).toBe('http_400');
    expect(e.raw).toEqual({ error: 'bad_request', extra: 'context' });
  });

  it('GenvorisAPIError uses provided code over derived http_<status>', () => {
    const e = new GenvorisAPIError({
      message: 'Rate limited',
      status: 429,
      code: 'rate_limited',
    });
    expect(e.code).toBe('rate_limited');
    expect(e.status).toBe(429);
  });

  it('GenvorisAPIError derives http_<status> when no code given', () => {
    const e = new GenvorisAPIError({ message: 'Server boom', status: 503 });
    expect(e.code).toBe('http_503');
  });

  it('GenvorisWebhookError defaults code', () => {
    const e = new GenvorisWebhookError('Signature mismatch.');
    expect(e).toBeInstanceOf(GenvorisError);
    expect(e.name).toBe('GenvorisWebhookError');
    expect(e.code).toBe('webhook_error');
  });

  it('all errors are catchable as GenvorisError', () => {
    const errors: GenvorisError[] = [
      new GenvorisError('a'),
      new GenvorisAuthError(),
      new GenvorisAPIError({ message: 'b', status: 500 }),
      new GenvorisWebhookError('c'),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(GenvorisError);
      expect(typeof err.code).toBe('string');
      expect(err.code.length).toBeGreaterThan(0);
    }
  });
});
