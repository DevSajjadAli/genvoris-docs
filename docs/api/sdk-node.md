---
sidebar_position: 9
title: Node SDK reference
description: Complete TypeScript reference for @genvoris/node — client, resources, errors, webhook verification, and retry strategy.
---

# `@genvoris/node` reference

The official Node.js SDK for the Genvoris Virtual Try-On API. A fully-typed wrapper around the REST API with built-in retries, timeouts, analytics resources, conversion attribution, returns tracking, and webhook signature verification.

:::danger Server-side only
Use `GENVORIS_API_KEY` only in backend code. Never bundle a `gvk_live_…` merchant key into browser JavaScript; browser-hosted widgets should use a same-origin proxy plus short-lived customer session tokens.
:::

```bash
npm install @genvoris/node
```

Requires Node.js **>= 18** (uses the built-in `fetch`, `crypto`, and `AbortController`).

## Client

```ts
import Genvoris from '@genvoris/node';

const gv = new Genvoris({
  apiKey: process.env.GENVORIS_API_KEY!,
  // optional:
  baseUrl: 'https://genvoris.org/api/v1',
  timeoutMs: 30_000,
  maxRetries: 3,
  defaultHeaders: { 'X-App-Version': '1.0.0' },
});
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | (required) | `gvk_live_…` or `gvk_test_…`. |
| `baseUrl` | `https://genvoris.org/api/v1` | Override for staging or a custom egress proxy. |
| `timeoutMs` | `30_000` | Per-request `AbortController` — a **fresh** controller is created on every retry so a slow first attempt cannot poison later attempts. |
| `maxRetries` | `3` | 429 / 5xx with exponential backoff + decorated jitter (see [Retry strategy](#retry-strategy) below). |
| `fetch` | `globalThis.fetch` | Inject `undici`, mocks, or a custom fetch implementation. |
| `defaultHeaders` | `{}` | Merged into every outgoing request. |

## Resources

### `gv.customers`

```ts
gv.customers.create(params)
//   params: { externalId, email?, planId?, metadata? }
//   returns: Customer

gv.customers.retrieve(id)
//   returns: Customer

gv.customers.update(id, params)
//   params: { email?, planId?, status?, metadata?, resetPeriod? }
//   returns: Customer

gv.customers.list(params?)
//   params: { status?, limit?, cursor? }
//   returns: CustomerList (data: Customer[], next_cursor?: string)

gv.customers.cancel(id)
//   returns: void (soft cancel — preserves usage history)

gv.customers.usage(id)
//   returns: CustomerUsage (current period stats + history)

gv.customers.sessions(id)
//   returns: CustomerSessionList
```

### `gv.plans`

```ts
gv.plans.create(params)
//   params: { name, monthlyTryOns, externalPriceId?, active? }
//   returns: Plan

gv.plans.retrieve(id)
//   returns: Plan

gv.plans.update(id, params)
//   params: { name?, monthlyTryOns?, externalPriceId?, active? }
//   returns: Plan

gv.plans.list(params?)
//   params: { includeInactive? }
//   returns: PlanList (data: Plan[])

gv.plans.archive(id)
//   returns: void (soft-disable — existing customers retain quota)
```

### `gv.sessions`

```ts
gv.sessions.mint(params)
//   params: { customerId, ttlSeconds? }
//   ttlSeconds defaults to 900 (15 min), clamped to [60, 3600]
//   returns: MintedSession { token, token_type, expires_in, expires_at, customer }

gv.sessions.revoke(params)
//   params: { customerId, jti }
//   returns: RevokedSession { jti, revoked: true }
```

### `gv.events`

```ts
gv.events.track({
  sessionId: 'session_12345678',
  eventType: 'WIDGET_OPENED',
  productId: 'sku_123',
  productTitle: 'Black Wrap Dress',
  pageUrl: 'https://shop.example.com/products/dress',
  metadata: { source: 'product_page' },
})
//   returns: EventsAccepted { accepted }

gv.events.trackBatch([
  { sessionId: 'session_12345678', eventType: 'PHOTO_UPLOADED' },
  { sessionId: 'session_12345678', eventType: 'TRYON_GENERATED', productId: 'sku_123' },
])
//   returns: EventsAccepted { accepted }
```

Supported event types are `WIDGET_OPENED`, `PHOTO_UPLOADED`, `TRYON_GENERATED`, `TRYON_VIEWED`, `RESULT_SHARED`, `ADDED_TO_CART`, `CHECKOUT_STARTED`, and `CLOSED`.

### `gv.conversions`

```ts
gv.conversions.create({
  orderId: 'order_1001',
  platform: 'custom', // 'shopify' | 'woocommerce' | 'custom'
  amountCents: 12900,
  currency: 'USD',
  quantity: 1,
  productId: 'sku_123',
  productTitle: 'Black Wrap Dress',
  sessionId: 'session_12345678',
  customerEmail: 'shopper@example.com',
  attributionWindowMinutes: 1440,
})
//   returns: ConversionEvent { id, attributedFromTryOn, deduped? }
```

### `gv.returns`

```ts
gv.returns.create({
  orderId: 'order_1001',
  platform: 'custom',
  refundedAmountCents: 12900,
  currency: 'USD',
  reason: 'size_exchange',
})
//   returns: ReturnEvent { id, conversionEventId }
```

### `gv.webhooks`

```ts
gv.webhooks.list()
//   returns: WebhookEndpointList (data: WebhookEndpoint[])

gv.webhooks.create(params)
//   params: { url, secret, events, description? }
//   returns: WebhookEndpoint

gv.webhooks.test(id)
//   returns: void (sends a synthetic webhook.test ping)

gv.webhooks.delete(id)
//   returns: void
```

## Webhook verification

The SDK provides a **static** method on `WebhooksResource` — no client instance needed.

```ts
import { WebhooksResource } from '@genvoris/node';

const event = WebhooksResource.verify({
  payload: req.body,           // Buffer or string of the RAW request body
  header: req.header('x-genvoris-signature') ?? '',
  secret: process.env.GENVORIS_WEBHOOK_SECRET!,
  toleranceSeconds: 300,       // optional, default 300 (5 min)
});
```

The signature header format is `t=<unix>,v1=<hex>`; the signed payload is `${t}.${rawBody}` using `HMAC-SHA256`. Comparison uses `crypto.timingSafeEqual` with a **byte-length guard** — a malformed or wrong-length `v1` value throws `"genvoris: signature mismatch"` (not a raw Node crypto error). A stale timestamp exceeding `toleranceSeconds` throws `"signature timestamp too old"`.

Return value is the parsed `GenvorisEvent<T>`:

```ts
interface GenvorisEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  created: number;
  data: T;
}
```

:::danger
You **must** verify the raw bytes Genvoris sent. If you parse JSON and re-serialise it, the HMAC will mismatch.
:::

## Errors

```ts
import {
  GenvorisAPIError,
  GenvorisAuthError,
  GenvorisRateLimitError,
  GenvorisValidationError,
} from '@genvoris/node';

try {
  await gv.customers.retrieve('cus_missing');
} catch (err) {
  if (err instanceof GenvorisAuthError) {
    // 401 / 403 — bad or revoked key
  } else if (err instanceof GenvorisRateLimitError) {
    // 429 — honour err.retryAfterSeconds
  } else if (err instanceof GenvorisValidationError) {
    console.error(err.fieldErrors);   // Record<string, string[]>
  } else if (err instanceof GenvorisAPIError) {
    console.error(err.status, err.code, err.requestId);
  }
}
```

All error classes extend `GenvorisAPIError`:

| Class | HTTP status | Extra properties |
| --- | --- | --- |
| `GenvorisAuthError` | 401, 403 | — |
| `GenvorisRateLimitError` | 429 | `retryAfterSeconds: number` |
| `GenvorisValidationError` | 400, 422 | `fieldErrors: Record<string, string[]>` |
| `GenvorisAPIError` | any other | `status`, `code`, `message`, `requestId` |

## Retry strategy

The client retries on **429**, **502**, **503**, and **504**, as well as on network errors (DNS failures, connection refused, timeout).

**Algorithm (decorated jitter):**

```
base        = 250ms × 2^attempt
jittered    = base × (0.7 + Math.random() × 0.6)     ← ±30 % spread
delay       = min(jittered, 8000ms)
```

This spreads retries across concurrent clients without the thundering-herd spike that full jitter causes at the start of each window. Each retry attempt creates a **fresh `AbortController`**, so a timeout on one attempt never leaks into the next.

| Attempt | Nominal delay | Range (jittered) |
| --- | --- | --- |
| 0 (first request) | 250 ms | 175–325 ms |
| 1 | 500 ms | 350–650 ms |
| 2 | 1 000 ms | 700–1 300 ms |
| 3 | 2 000 ms | 1 400–2 600 ms |
| 4 | 4 000 ms | 2 800–5 200 ms |
| 5+ | 8 000 ms | 5 600–8 000 ms |

Maximum retries is controlled via `maxRetries` (default 3). Non-retryable errors (4xx outside the set above) throw immediately.

## See also

- [REST authentication](./authentication)
- [Webhook events](./webhooks)
- [Express example](../examples/express)
