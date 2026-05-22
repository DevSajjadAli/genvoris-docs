import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { WebhooksResource, GenvorisWebhookError } from '../src';

function sign(body: string, secret: string, ts: number): string {
  const sig = createHmac('sha256', secret).update(`${ts}.${body}`, 'utf8').digest('hex');
  return `t=${ts},v1=${sig}`;
}

describe('WebhooksResource.verify', () => {
  const secret = 'whsec_test_secret';
  const body = JSON.stringify({
    id: 'evt_1',
    type: 'tryon.completed',
    createdAt: '2026-01-01T00:00:00Z',
    data: { ok: true },
  });

  it('verifies a fresh signature', () => {
    const now = 1_700_000_000;
    const header = sign(body, secret, now);
    const event = WebhooksResource.verify({
      payload: body,
      header,
      secret,
      now: () => now,
    });
    expect(event.type).toBe('tryon.completed');
  });

  it('rejects a stale signature', () => {
    const now = 1_700_000_000;
    const header = sign(body, secret, now - 3600);
    expect(() =>
      WebhooksResource.verify({ payload: body, header, secret, now: () => now }),
    ).toThrow(GenvorisWebhookError);
  });

  it('rejects a tampered body', () => {
    const now = 1_700_000_000;
    const header = sign(body, secret, now);
    const tampered = body.replace('ok', 'bad');
    expect(() =>
      WebhooksResource.verify({ payload: tampered, header, secret, now: () => now }),
    ).toThrow(GenvorisWebhookError);
  });

  it('rejects a missing header', () => {
    expect(() =>
      WebhooksResource.verify({ payload: body, header: null, secret }),
    ).toThrow(GenvorisWebhookError);
  });

  it('rejects a malformed header', () => {
    expect(() =>
      WebhooksResource.verify({ payload: body, header: 'not-a-real-header', secret }),
    ).toThrow(GenvorisWebhookError);
  });
});
