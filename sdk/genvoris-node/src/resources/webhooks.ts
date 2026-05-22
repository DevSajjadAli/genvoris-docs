/**
 * Webhook signature verification.
 *
 * Algorithm (matches portal `lib/webhooks.ts`):
 *   header   := "t=<unix>,v1=<hex(hmac_sha256(secret, t + '.' + body))>"
 *   payload  := raw request body (UTF-8 string; do NOT JSON.parse before verify)
 *   tolerance: reject when |now - t| > tolerance (default 300 s)
 *
 * Constant-time compare via `crypto.timingSafeEqual`.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { GenvorisWebhookError } from '../errors';
import { WebhookEvent } from '../types';

const DEFAULT_TOLERANCE_SEC = 300;

export interface VerifyOptions {
  /** Raw request body, exactly as received. */
  payload: string | Buffer;
  /** The value of the `Genvoris-Signature` header. */
  header: string | null | undefined;
  /** Endpoint secret shown in the Genvoris dashboard. */
  secret: string;
  /** Max clock-skew in seconds. Default 300. */
  toleranceSec?: number;
  /** Override "now" -- used by tests. */
  now?: () => number;
}

export class WebhooksResource {
  /**
   * Verifies the signature header and returns the decoded event. Throws
   * `GenvorisWebhookError` on any failure -- never returns false. This
   * matches the Stripe SDK idiom (`Webhook.constructEvent`) so the
   * surrounding `try/catch` is the only safe pattern.
   */
  static verify<T = unknown>(opts: VerifyOptions): WebhookEvent<T> {
    if (!opts.secret) {
      throw new GenvorisWebhookError('Missing webhook secret.', 'missing_secret');
    }
    if (!opts.header) {
      throw new GenvorisWebhookError('Missing Genvoris-Signature header.', 'missing_header');
    }

    const { timestamp, signature } = parseHeader(opts.header);
    const tolerance = opts.toleranceSec ?? DEFAULT_TOLERANCE_SEC;
    const now = opts.now ? opts.now() : Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      throw new GenvorisWebhookError('Webhook timestamp outside tolerance window.', 'timestamp_skew');
    }

    const bodyStr = Buffer.isBuffer(opts.payload) ? opts.payload.toString('utf8') : opts.payload;
    const expected = createHmac('sha256', opts.secret)
      .update(`${timestamp}.${bodyStr}`, 'utf8')
      .digest('hex');

    if (!constantTimeEqualHex(expected, signature)) {
      throw new GenvorisWebhookError('Signature mismatch.', 'bad_signature');
    }

    let event: WebhookEvent<T>;
    try {
      event = JSON.parse(bodyStr) as WebhookEvent<T>;
    } catch {
      throw new GenvorisWebhookError('Body is not valid JSON.', 'bad_json');
    }
    if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
      throw new GenvorisWebhookError('Decoded body is not a WebhookEvent.', 'bad_shape');
    }
    return event;
  }
}

function parseHeader(header: string): { timestamp: number; signature: string } {
  const parts = header.split(',').map((p) => p.trim());
  let timestamp: number | null = null;
  let signature: string | null = null;
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    const k = p.slice(0, eq);
    const v = p.slice(eq + 1);
    if (k === 't') timestamp = Number.parseInt(v, 10);
    else if (k === 'v1' && !signature) signature = v;
  }
  if (timestamp === null || Number.isNaN(timestamp) || !signature) {
    throw new GenvorisWebhookError('Malformed Genvoris-Signature header.', 'bad_header');
  }
  return { timestamp, signature };
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}
