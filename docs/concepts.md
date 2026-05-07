---
sidebar_position: 3
title: Concepts
description: Credits, packs, plans, customers, sessions, quotas — how the pieces fit together.
---

# Concepts

## The two-layer model

Genvoris separates **what you owe us** from **what your customers owe you**.

### Layer 1 — Credit packs (you ↔ us)

You purchase credit packs. Each pack has:

- A **credit count** (e.g. 1,000 try-ons).
- A **price-per-credit** locked at purchase.
- A **1-year validity** from purchase date.
- **FIFO consumption** — the soonest-expiring pack drains first.

You may hold multiple packs at once. The portal shows the live balance and history.

### Layer 2 — End-customer plans (you ↔ your customer)

Plans are the SKUs **you sell** in your own storefront. Each plan defines:

- A **monthly try-on quota** (e.g. 100/month).
- An optional **`externalPriceId`** — your billing system's identifier so you can map our records back to yours.

Genvoris **does not** price the plan, charge the customer, or hold their card. That's all you.

When an end-customer hits their plan quota, **we return 402** and surface the limit; you decide what UX to render.

## Sessions

Browsers can't be trusted with your store API key, so we don't expose it there. Instead, your **server** mints short-lived RS256 JWTs scoped to a single end-customer:

```
POST /api/v1/customers/{id}/sessions   →   { token, expires_in }
```

The token's claims are:

| Claim | Meaning |
| --- | --- |
| `sub` | Genvoris end-customer id |
| `sid` | Your store user id (matches the API key) |
| `pid` | Plan id snapshot at mint time |
| `iss` | `https://genvoris.org` |
| `aud` | `genvoris-widget` |
| `exp` | Unix expiry |

You can verify these tokens yourself by fetching `https://genvoris.org/.well-known/jwks.json` — useful for plugins that need offline verification.

## Quota arithmetic

Each end-customer has a rolling 30-day period (`periodStart`, `periodEnd`). On every successful try-on:

```
EndCustomer.usage[currentPeriod].tryOnsUsed += 1
Store.creditPool                            -= 1   (FIFO)
```

When `tryOnsUsed >= plan.monthlyTryOns`, further try-ons return:

```json
{ "error": "end_customer_quota", "reason": "quota_exhausted", "limit": 100, "used": 100 }
```

Recreate / re-PATCH the customer with `resetPeriod: true` to roll forward immediately, or wait for `periodEnd` — we auto-roll on next request.

## Credit pool depletion

If **your** credit pool runs out, every try-on (including end-customer ones) returns `402 credit_limit_reached`. Top up via the Billing page in the portal.

## Backwards compatibility

The legacy single-tenant flow (no end-customer token) still works exactly as before. Layer 2 only activates when `end_customer_token` is present.

## How drop-in integrations express L2

Drop-in integrations like the [Shopify app](./integrations/shopify) wrap L2 in storefront-friendly UX. On Shopify, the merchant picks one of five **monetisation models** in the app's admin:

| Model | L2 mapping |
| --- | --- |
| `FREE_ALL` | No `planId` enforced — every shopper unlimited; merchant absorbs L1 cost |
| `SUBSCRIPTION` | One Genvoris plan per shop; activated while shopper holds an active Shopify selling plan |
| `CREDITS_WITH_PURCHASE` | Custom quota stored in the app's DB, granted on `orders/paid`, expires per config |
| `PAY_PER_USE` | One-shot session minted after a paid Shopify draft order |
| `FREEMIUM` | Two Genvoris plans per shop (free + paid); upgrade flow via Shopify subscription product |

The underlying API contract is unchanged — the Shopify app calls the same `/api/v1/customers` and `/api/v1/customers/{id}/sessions` endpoints documented here.
