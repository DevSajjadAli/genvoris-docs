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

## Programmatic trigger — `window.Genvoris`

Once `widget.js` has loaded it publishes a small global API. Use this when you want to open the modal from your own button, your own React component, or in response to a non-click event (URL hash, modal close, etc).

```js
window.Genvoris.openTryOn({
  productImages: ['/img/dress-front.jpg', '/img/dress-back.jpg'],
  productTitle: 'Black Wrap Dress',
  productCategory: 'apparel',           // 'apparel' | 'home' | 'object' | 'other'
  page_url: window.location.href,
  token: optionalSessionJwt,            // overrides data-end-customer-token
});
```

All fields are optional. When omitted the widget falls back to the values declared on the loader `<script>` tag.

### Declarative attribute — `data-genvoris-trigger`

Any element with `data-genvoris-trigger` becomes a try-on button. Per-button overrides go on the same element via `data-*` attributes:

```html
<button
  data-genvoris-trigger
  data-product-image="/img/dress.jpg"
  data-product-title="Black Wrap Dress"
  data-product-category="apparel"
>
  Try it on
</button>
```

The widget binds at load time **and** watches for late-mounted DOM (SPA routing, AJAX-rendered collection grids) via `MutationObserver`, so dynamically inserted triggers are picked up automatically without you calling any `init()` function.

### `productImages` vs `data-product-image`

- Use `productImages` (array) in JS, or repeat `data-product-image` on multiple attributes, when you want to give the model several reference shots. This dramatically improves results for `apparel` and `object` categories.
- A single `data-product-image` is fine for hero images.

## Public widget config endpoint

The portal exposes a public read-only endpoint that the widget script calls on boot to fetch the merchant's Button Designer choices (label, icon, border-radius, etc):

```
GET https://api.genvoris.org/api/widget/button-design?key=<your-api-key>
```

The response is safe to expose — it contains no secrets, only display preferences. It is cached for 60 seconds at the edge and falls back to defaults when the key is unknown so a misconfigured site never breaks.

```json
{
  "data": {
    "label": "Try On",
    "icon": "sparkles",
    "borderRadius": 8,
    "fontSize": 14,
    "paddingX": 20,
    "paddingY": 10,
    "position": "inline",
    "showOnCards": false
  }
}
```

