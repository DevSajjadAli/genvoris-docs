---
sidebar_position: 9
title: Node SDK reference
description: TypeScript reference for @genvoris/node.
---

# `@genvoris/node` reference

The official Node SDK is a thin typed wrapper around the REST API with built-in retries, timeouts, and webhook signature verification.

```bash
npm install @genvoris/node
```

Requires Node.js **&gt;= 18** (uses the built-in `fetch`).

## Client

```ts
import Genvoris from '@genvoris/node';

const gv = new Genvoris({
  apiKey: process.env.GENVORIS_API_KEY!,
  // optional:
  baseUrl: 'https://api.genvoris.org',
  timeoutMs: 30_000,
  maxRetries: 3,
  defaultHeaders: { 'X-App-Version': '1.0.0' },
});
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | (required) | `gvk_live_…` or `gvk_test_…`. |
| `baseUrl` | `https://api.genvoris.org` | Override for staging or a custom egress proxy. |
| `timeoutMs` | `30_000` | Per-request `AbortController`. |
| `maxRetries` | `3` | 429 / 5xx with exponential backoff + jitter. |
| `fetch` | `globalThis.fetch` | Inject `undici` / mocks if needed. |
| `defaultHeaders` | `{}` | Merged into every request. |

## Resources

### `gv.customers`

```ts
gv.customers.create({ externalId, email?, planId? })
gv.customers.retrieve(externalIdOrId)
gv.customers.update(id, { email?, planId? })
gv.customers.list({ limit?, cursor? })
gv.customers.usage(id)        // { used, limit, period_end }
gv.customers.sessions(id)     // active sessions
```

### `gv.plans`

```ts
gv.plans.create({ name, monthlyTryOns, externalPriceId })
gv.plans.retrieve(id)
gv.plans.update(id, partial)
gv.plans.list()
gv.plans.archive(id)
```

### `gv.sessions`

```ts
gv.sessions.mint({ customerId, ttlSeconds? })   // returns { token, expires_at, ... }
```

### `gv.webhooks`

```ts
gv.webhooks.list()
gv.webhooks.create({ url, secret, events: ['tryon.completed', ...] })
gv.webhooks.test(id)
gv.webhooks.delete(id)
```

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
    console.error(err.fieldErrors);
  } else if (err instanceof GenvorisAPIError) {
    console.error(err.status, err.code, err.requestId);
  }
}
```

## Webhook verification

```ts
import { WebhooksResource } from '@genvoris/node';

const event = WebhooksResource.verify({
  payload: req.body,           // Buffer of the RAW request body
  header: req.header('genvoris-signature') ?? '',
  secret: process.env.GENVORIS_WEBHOOK_SECRET!,
  toleranceSeconds: 300,       // optional, default 300
});
```

The signature header format is `t=<unix>,v1=<hex>`; the signed payload is `${t}.${rawBody}` using `HMAC-SHA256`. Comparison uses `crypto.timingSafeEqual`.

:::danger
You **must** verify the raw bytes Genvoris sent. If you parse JSON and re-serialise it, the HMAC will mismatch.
:::

## Retry strategy

The client retries `429`, `502`, `503` and `504`. Sleep is `min(2^n * 250ms, 8000ms)` with full jitter, capped at `maxRetries`. Non-retryable errors throw immediately.

## See also

- [REST authentication](./authentication)
- [Webhook events](./webhooks)
- [Express example](../examples/express)
