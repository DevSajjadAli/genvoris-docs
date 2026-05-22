---
sidebar_position: 7
title: Webhooks
description: Real-time outbound events with HMAC-SHA256 signing and exponential-backoff retries.
---

# Webhooks

Genvoris pushes lifecycle and quota events to your backend in real time. Configure endpoints in **Dashboard → Webhooks**. Each endpoint has its own signing secret (shown once at creation).

:::danger Signature verification is REQUIRED

You **MUST** verify the `X-Genvoris-Signature` header before processing any webhook payload. Skipping verification lets an attacker forge events (fake quota grants, fake cancellations, fake customer creates) by `POST`ing to your public webhook URL — this is a **critical** security vulnerability.

The verification snippets below use `timingSafeEqual` / `hash_equals` for constant-time comparison and a 300-second timestamp window for replay protection. Do not skip either step.

:::

## Events

| Event | Fires when |
| --- | --- |
| `end_customer.created` | First time a customer is upserted via `POST /v1/customers` |
| `end_customer.updated` | A customer is upserted again or `PATCH`'d |
| `end_customer.cancelled` | A customer is `DELETE`'d (soft cancel) |
| `end_customer.quota_warning` | Customer crosses **80%** of plan quota in current period (once per period) |
| `end_customer.quota_exhausted` | A try-on was rejected for quota — fired even on the rejecting request |
| `end_customer.period_rolled` | Period auto-rolled to a new 30-day window |
| `plan.created` | A plan was created |
| `plan.updated` | A plan was updated |
| `plan.disabled` | A plan was soft-deleted |

## Payload shape

Every delivery is a JSON envelope:

```json
{
  "id": "evt_8f3a...",
  "type": "end_customer.quota_warning",
  "created": 1745812345,
  "data": {
    "customer_id": "ec_abc",
    "external_id": "user_42",
    "plan_id": "pln_xxxx",
    "used": 80,
    "limit": 100,
    "remaining": 20,
    "threshold": 0.8
  }
}
```

## Signature header

```
X-Genvoris-Signature: t=1745812345,v1=4ef9...c2
X-Genvoris-Event:     end_customer.quota_warning
X-Genvoris-Delivery:  whd_abcd1234
```

The signed string is `${t}.${rawRequestBody}`, HMAC-SHA256 with your endpoint secret.

### Verifying — Node

```ts
import { createHmac, timingSafeEqual } from 'crypto'

function verify(secret: string, rawBody: string, header: string) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=').map(s => s.trim())))
  const ts = parseInt(parts.t, 10)
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false   // 5-min tolerance
  const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(parts.v1, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
```

### Verifying — PHP

```php
function gv_verify($secret, $rawBody, $header) {
  preg_match('/t=(\d+),v1=([a-f0-9]+)/', $header, $m);
  if (!$m) return false;
  if (abs(time() - (int)$m[1]) > 300) return false;
  $expected = hash_hmac('sha256', $m[1] . '.' . $rawBody, $secret);
  return hash_equals($expected, $m[2]);
}
```

## Delivery semantics

- **Timeout** per attempt: 10 s.
- **Success**: any `2xx`.
- **Retry on**: anything else, plus network errors.
- **Backoff** (seconds): `10, 30, 120, 300, 900, 3600, 10800, 21600`.
- **Max attempts**: 8. After that the delivery is marked `DEAD` and not retried again.
- **Ordering**: not guaranteed. Use the envelope `id` for idempotency on your side.

## Test ping

Each endpoint has a "Send test ping" button in the dashboard. It dispatches a synthetic `webhook.test` event with body `{"message": "Hello from Genvoris"}` so you can verify your handler before going live.

## Disabling

Disabling an endpoint stops new dispatches. Pending retries for already-failed deliveries are also skipped.
