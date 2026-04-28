---
sidebar_position: 5
title: Widget & Try-on
description: Drop-in widget script and the underlying try-on flow.
---

# Widget & Try-on

The Genvoris widget lets your customers virtually try a product on with a single click. Server-side, every successful try-on debits your credit pool **and** the end-customer's per-period quota.

## Drop-in script

Place this on any product page:

```html
<button class="genvoris-tryon-btn" data-product-image="/img/dress.jpg">
  Virtual Try-on
</button>

<script
  src="https://cdn.genvoris.org/widget.js"
  defer
  data-api-key="gvk_live_xxxxxxxx"
  data-end-customer-token="<%= sessionToken %>"
></script>
```

| Attribute | Required | Notes |
| --- | --- | --- |
| `data-api-key` | yes | Your Genvoris store key, also enforced server-side |
| `data-end-customer-token` | optional | Session JWT — when present, per-customer quota is enforced |

If you omit `data-end-customer-token`, the widget runs in **legacy mode**: every try-on debits your credit pool with no per-customer accounting.

## Underlying flow

The widget calls your try-on backend, which forwards to Genvoris:

```
Browser  ──▶  Your try-on backend  ──▶  POST /api/tryon/track
              (FastAPI / Node / etc)            x-internal-secret: ...
                                                 api_key, end_customer_token, ...
```

`/api/tryon/track` is a server-to-server endpoint, **not** browser-callable. The `x-internal-secret` env shared between your try-on backend and the portal authenticates the call. If you're using our reference FastAPI backend, this is wired up for you.

## Request body — `POST /api/tryon/track`

```json
{
  "api_key": "gvk_live_xxxxxxxx",
  "product_type": "apparel",
  "variation_count": 4,
  "generation_time_ms": 1820,
  "success": true,
  "page_url": "https://shop.com/p/dress-42",
  "product_title": "Black Wrap Dress",
  "origin": "https://shop.com",
  "end_customer_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

`end_customer_token` is **optional**. When present:

- We verify the JWT (`iss=https://genvoris.org`, `aud=genvoris-widget`).
- The token's `sid` claim **must equal** the api key's owner; mismatched store ↔ token returns 403.
- The customer's plan quota is enforced **before** debiting your pool. Insufficient quota = 402 + nothing debited.
- After a successful debit, per-customer usage is incremented by 1.

## Response

```json
{
  "success": true,
  "remaining_credits": 4823,
  "variation_count": 4,
  "end_customer_quota": { "used": 33, "limit": 100, "remaining": 67 }
}
```

`end_customer_quota` is only present when an end-customer token was supplied.

## Error matrix

| HTTP | `error` | When |
| --- | --- | --- |
| 401 | `unauthorized` | Bad `x-internal-secret` |
| 401 | `invalid_key` | Bad API key |
| 401 | `invalid_session_token` | JWT failed verification or expired |
| 402 | `credit_limit_reached` | Your store's credit pool empty |
| 402 | `end_customer_quota` | Per-customer plan exhausted (`reason` = `quota_exhausted` / `no_plan` / `paused` / `cancelled`) |
| 403 | `account_inactive` | Store account suspended |
| 403 | `domain_not_allowed` | Origin not whitelisted on the API key |
| 403 | `token_store_mismatch` | JWT's `sid` ≠ API key owner |

## Custom widget UX

You can build your own widget — call your backend, which calls `/api/tryon/track`. The Genvoris widget script is convenience; the API is the contract.
