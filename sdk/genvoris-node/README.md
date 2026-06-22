# `@genvoris/node`

Official Node.js SDK for the [Genvoris](https://genvoris.org) Virtual Try-On API.

```bash
npm install @genvoris/node
```

Node.js >= 18 is required (uses built-in `fetch`, `crypto`, and `AbortController`).

## Usage

```ts
import Genvoris from '@genvoris/node';

// Server-side only. Never expose GENVORIS_API_KEY in browser code.
const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });

const customer = await gv.customers.create({
  externalId: 'shop_user_42',
  email: 'jane@example.com',
});

const session = await gv.sessions.mint({
  customerId: customer.id,
  ttlSeconds: 3600,
});

// Hand `session.token` to the widget on the storefront, alongside
// same-origin proxy/event URLs. Do not render your live API key.
```

## Configuration

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | (required) | Starts with `gvk_live_` or `gvk_test_`. |
| `baseUrl` | `https://genvoris.org/api/v1` | Override for self-hosting / staging. |
| `timeoutMs` | `30_000` | Per-request timeout via `AbortController` (fresh controller per retry). |
| `maxRetries` | `3` | Retries on 429 / 5xx with exponential backoff + decorated jitter. |
| `fetch` | `globalThis.fetch` | Provide your own (e.g. `undici`) if needed. |
| `defaultHeaders` | `{}` | Attached to every request. |

## Resources

```ts
// Customers
gv.customers.create({ externalId, email?, planId?, metadata? })
gv.customers.retrieve(id)
gv.customers.update(id, { email?, planId?, status?, metadata?, resetPeriod? })
gv.customers.list({ status?, limit?, cursor? })
gv.customers.cancel(id)
gv.customers.usage(id)
gv.customers.sessions(id)

// Plans
gv.plans.create({ name, monthlyTryOns, externalPriceId?, active? })
gv.plans.retrieve(id)
gv.plans.update(id, { name?, monthlyTryOns?, externalPriceId?, active? })
gv.plans.list({ includeInactive? })
gv.plans.archive(id)

// Sessions
gv.sessions.mint({ customerId, ttlSeconds? })    // default 900s, clamped [60, 3600]
gv.sessions.revoke({ customerId, jti })

// Events
gv.events.track({ sessionId, eventType, productId?, productTitle?, pageUrl?, metadata? })
gv.events.trackBatch([{ sessionId, eventType }])

// Conversions and returns
gv.conversions.create({ orderId, platform, amountCents, currency?, quantity?, productId?, sessionId? })
gv.returns.create({ orderId, platform, refundedAmountCents, currency?, reason? })

// Webhooks
gv.webhooks.list()
gv.webhooks.create({ url, secret, events, description? })
gv.webhooks.test(id)
gv.webhooks.delete(id)
```

## Hosted widget integration

Use this SDK from your backend to mint short-lived customer session tokens, record conversions/returns, and verify webhooks. For browser-hosted widgets, route try-on and analytics calls through your own same-origin endpoint or another approved public-widget flow; do not place `gvk_live_...` keys in HTML or client JavaScript.

## Webhook verification

```ts
import { WebhooksResource } from '@genvoris/node';

const event = WebhooksResource.verify({
  payload: req.body,           // Buffer of the RAW request body
  header: req.headers['x-genvoris-signature'] as string,
  secret: process.env.GENVORIS_WEBHOOK_SECRET!,
  toleranceSeconds: 300,       // optional, default 300
});
// event.id, event.type, event.created, event.data
```

The signature header format is `t=<unix>,v1=<hex>`; the signed payload is `${t}.${rawBody}` using `HMAC-SHA256`. Comparison uses `crypto.timingSafeEqual` with a byte-length guard. A stale timestamp throws `"signature timestamp too old"`; a malformed signature throws `"genvoris: signature mismatch"`.

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

## Retry strategy

Retries on 429, 502, 503, 504 and network errors. Uses **decorated jitter**:

```
delay = min(250ms × 2^attempt × (0.7 + Math.random() × 0.6), 8000ms)
```

This gives a ±30% spread around the exponential target, avoiding the thundering-herd spike that full jitter causes.

## License

MIT © Genvoris
