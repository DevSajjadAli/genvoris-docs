---
sidebar_position: 2
title: Quickstart
description: From zero to a working try-on against a metered end-customer plan in five minutes.
---

# Quickstart

This walkthrough takes you from a fresh Genvoris account to a metered try-on running against an end-customer plan, in **five steps** using the universal REST API.

> **On Shopify?** Skip everything below — the [Shopify app](./integrations/shopify) handles plans, sessions, billing and theme injection for you. Two clicks instead of five steps.

> Prerequisites: a Genvoris store account with at least one verified domain and a credit pack.

## 1. Get your store API key

In the dashboard, open **Integration → API keys** and copy your `gvk_live_…` key.

```bash
export GENVORIS_API_KEY="gvk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 2. Create a plan

Plans are the SKUs you sell to your end-customers. Each plan defines a **monthly try-on quota**.

```bash
curl -X POST https://genvoris.org/api/v1/plans \
  -H "Authorization: Bearer $GENVORIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro",
    "monthlyTryOns": 100,
    "externalPriceId": "price_1NXXXX"
  }'
```

The response includes the plan's `id` (`pln_…`). Save it.

## 3. Register an end-customer

When **your** billing system records a successful subscription, call us:

```bash
curl -X POST https://genvoris.org/api/v1/customers \
  -H "Authorization: Bearer $GENVORIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "user_42",
    "email": "shopper@example.com",
    "planId": "pln_xxxxxxxx"
  }'
```

`externalId` is **your** identifier (Stripe customer id, Shopify customer id, anything stable). It is unique per store, so you can call this endpoint on every renewal — it will upsert and roll the period forward.

## 4. Mint a session for the browser

When the end-customer lands on a product page, your backend mints a short-lived JWT they can use from JavaScript:

```bash
curl -X POST https://genvoris.org/api/v1/customers/{customerId}/sessions \
  -H "Authorization: Bearer $GENVORIS_API_KEY"
```

Response:

```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "customer": {
    "id": "ec_xxxx",
    "external_id": "user_42",
    "plan_name": "Pro",
    "monthly_try_ons": 100,
    "period_end": "2026-05-28T00:00:00.000Z"
  }
}
```

Default lifetime is 15 minutes. Return the token to your page template or frontend route; do not return your merchant live API key.

## 5. Run a metered try-on

The Genvoris widget on your storefront attaches the token to requests sent through your same-origin backend proxy. The proxy forwards approved try-on/event paths to Genvoris and injects `GENVORIS_API_KEY` server-side:

```html
<script
  src="https://api.genvoris.org/widget.js?no_fab=1"
  defer
  data-api-url="/genvoris-proxy/"
  data-events-url="/genvoris-proxy/api/v1/events"
  data-token="eyJhbGciOi..."
  data-platform="custom"
  data-no-fab="true"
></script>
```

If the customer's quota is exhausted, the widget receives `402 end_customer_quota` and you can show your own paywall / upgrade flow.

## What's next

- [API reference →](./api/authentication)
- [How quotas + billing work →](./concepts)
- [Embedding the widget →](./api/widget)
