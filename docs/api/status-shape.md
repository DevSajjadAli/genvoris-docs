---
sidebar_position: 1
title: Status shape & cross-system conventions
description: Canonical shape of the /status endpoint, externalId prefixes, and the access state vocabulary shared across the widget, Shopify app, WordPress plugin, and SDKs.
---

# Status shape & cross-system conventions

The `/status` endpoint is the single contract that every Genvoris consumer (widget, Shopify app block, WordPress plugin, Node/PHP SDKs, dashboard) depends on to decide whether to render the try-on UI, how much quota to show, and which upsell to surface. This page is the **canonical reference** — duplicated knowledge in any consumer must agree with what's here.

## Endpoint

`GET /status?api_key=<key>`

Served by the upstream Python backend. Consumers should call it through their own proxy (`/genvoris-proxy/status` in WordPress, `/api/proxy/status` in Shopify, `/api/genvoris/status` in Laravel) so the merchant's API key never reaches the browser.

## Response shape

```json
{
  "access": "ALLOWED",
  "message": "string, optional human-readable explanation",
  "quota": {
    "used": 12,
    "limit": 1000,
    "resetsAt": "2026-12-01T00:00:00Z"
  },
  "plan": "free | starter | growth | scale",
  "monetizationModel": "per_tryon | per_order | subscription",
  "overageEnabled": false,
  "externalId": "shopify_12345 | wp_42 | woocommerce_42 | laravel_42"
}
```

### `access` (required, enum)

The whole UI fork lives on this field. Treat it as a closed enum:

| Value | Meaning | UI |
| --- | --- | --- |
| `ALLOWED` | Try-on is permitted right now. | Render try-on trigger. |
| `LOCKED` | Merchant disabled the feature, or hard-blocked by plan. | Render upsell card with CTA. |
| `EXHAUSTED` | Quota is at limit and overage is off. | Render reset notice + upgrade CTA. |
| `ERROR` | Transient upstream failure. Consumer should retry once, then hide. | Hide trigger. |

Any other value MUST be treated as `ERROR`. Do not crash on unknown values — the contract reserves the right to add new states (backwards compatible: new states default to "hide trigger").

### `quota` (optional)

Present whenever `monetizationModel` is `per_tryon`. May be absent for subscription plans.

### `externalId` prefixes (canonical)

The Genvoris account is keyed by the merchant's source platform plus the platform-native id. Use **exactly** these prefixes — the upstream backend pattern-matches on them for dashboards and Stripe metadata:

| Source platform | Prefix | Example |
| --- | --- | --- |
| Shopify | `shopify_` | `shopify_12345` (shop id) |
| WordPress core | `wp_` | `wp_42` (user id) |
| WooCommerce | `woocommerce_` | `woocommerce_42` (customer id) |
| Laravel apps via package | `laravel_` | `laravel_42` (user id) |
| Generic self-hosted | `external_` | `external_<your-id>` |

Never invent a new prefix — open an issue first. Adding a prefix without updating the dashboard breaks revenue reporting.

## Caching

Consumers SHOULD cache the response for the duration of the page view but MUST re-fetch on:

- The `genvoris:tryon-completed` window event (quota changed)
- A `visibilitychange` event after > 5 minutes hidden (session may have expired)

Do not cross-cache across users on a single page (e.g. server-side full-page caching) — `quota.used` is per-account.

## Error code vocabulary

Errors that the proxy or backend can return in the JSON body (HTTP 4xx/5xx) follow this short canonical map. Keep your localized message tables keyed off these codes:

| `code` | HTTP | Meaning |
| --- | --- | --- |
| `invalid_api_key` | 401 | Key revoked, malformed, or absent. |
| `cross_origin` | 403 | Origin / Referer doesn't match merchant home URL. |
| `path_not_allowed` | 404 | Proxy received a path outside the allow-list. |
| `rate_limited` | 429 | Per-shop or per-IP rate limit tripped. Response carries `Retry-After` header. |
| `quota_exhausted` | 402 | `per_tryon` plan ran out and overage is disabled. |
| `upstream_unreachable` | 502 | Backend timeout / DNS failure / 5xx pass-through. |
| `internal_error` | 500 | Genuine server bug. |

Adding a new code requires updating every consumer's message bundle — prefer reusing an existing code when possible.

## Pinning the contract in tests

Each consumer SHOULD have at least one test that:

1. Mocks the upstream `/status` returning every `access` value above
2. Asserts the consumer renders the documented UI fork (button vs. upsell vs. exhausted vs. hidden)
3. Asserts unknown `access` values fall through to "hide trigger" (not a crash)

The Node SDK exposes type-level enforcement via the `StatusResponse` type. PHP/Laravel consumers should keep their Data Object class in sync with the table above.

## Version compatibility

This document tracks the shape supported by:

- `widget.js` ≥ 1.0.0
- `@genvoris/node` ≥ 1.0.0
- `genvoris/laravel` ≥ 1.0.0
- WordPress plugin ≥ 1.0.0
- Shopify app ≥ 1.0.0

Breaking changes to this shape will bump the major of all consumers in lock-step and be called out in the changelog.
