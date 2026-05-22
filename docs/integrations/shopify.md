---
sidebar_position: 2
title: Shopify
description: Native Shopify app — install, pick a pricing model, drop one theme block, done.
---

# Shopify

The **Genvoris Virtual Try-On** Shopify app turns the universal REST flow described in [Custom integration](./custom) into a one-click install. It handles install, theme injection, plan creation, per-shopper quota, payments, and privacy webhooks — you only choose how shoppers should pay.

> Listing: [Shopify App Store → Genvoris Virtual Try-On](https://apps.shopify.com/genvoris-virtual-try-on)

## What it gives you

- **One-click install** from the Shopify App Store. The install flow automatically provisions your Genvoris portal account and links your store. No second signup.
- **Theme block** for the theme editor — drop "Genvoris Try-On" onto your product template, no code edits required.
- **Five monetisation models** (pick one in `App → Monetization`):

  | Model | What the shopper does |
  | --- | --- |
  | `FREE_ALL` | Tries on freely. Merchant absorbs the cost. |
  | `SUBSCRIPTION` | Buys a recurring subscription product → unlimited try-ons while active. |
  | `CREDITS_WITH_PURCHASE` | Each paid order grants N try-on credits (configurable expiry). |
  | `PAY_PER_USE` | Pays per try-on at a one-off checkout. |
  | `FREEMIUM` | First N/month free; afterwards a paid subscription product. |
- **Signed storefront calls** — every widget request is signed by Shopify (`/apps/genvoris/*`), so your Genvoris API key never leaves your store backend.
- **Two-layer accounting** — the app debits your Genvoris credit pool *and* meters per-shopper quota inside the app.
- **GDPR / privacy webhooks** wired out of the box (`customers/data_request`, `customers/redact`, `shop/redact`).

## Install

1. From the Shopify App Store, click **Add app** and accept the requested scopes.
2. The app's **Settings** page is the only thing you have to fill in:
   - Paste your Genvoris store API key (issued in the [Genvoris dashboard](https://genvoris.org/dashboard) under **Integration → API keys**).
   - Click **Test connection**.
3. Open **Monetization**, pick a model, save. For `FREEMIUM` and `SUBSCRIPTION` the app auto-creates the matching Shopify subscription product **and** the matching Genvoris plan via [`POST /api/v1/plans`](../api/plans).
4. In **Online Store → Themes → Customise**, add the **Genvoris Try-On** block to your product template. Save.

That's it. Visit any product page — the widget loads and behaves according to your chosen model.

## Scopes the app requests

| Scope | Why |
| --- | --- |
| `read_products` / `write_products` | List products in the admin UI; auto-create the subscription product and selling-plan group for paid monetisation models. |
| `read_orders` / `write_orders` | Read paid orders for `CREDITS_WITH_PURCHASE`; create one-off checkouts for `PAY_PER_USE`. **This triggers Shopify's Protected Customer Data review** — approve it during install. |

The app **does not** request `read_customers` / `write_customers`. Shopper identity is sourced from the App-Proxy session, and the app never queries customer records via the Admin API.

## Storefront request flow

```
Storefront product page
       │
       │  /apps/genvoris/status?logged_in_customer_id=…
       ▼  (signed by Shopify App Proxy)
Genvoris Shopify app
       │
       │  Reads the verified shop from the proxy session,
       │  uses the stored API key to call:
       ▼
genvoris.org /api/v1/customers/{id}/usage
       │
       ▼
JSON: { canTryOn, ctaType, remaining, … }
       │
       ▼
Widget chooses one of:
 • Show "Try On" button       (canTryOn = true)
 • Redirect to /apps/genvoris/checkout    (PAY_PER_USE)
 • Show upgrade banner with plan URL      (FREEMIUM exhausted)
 • Show "Subscribe" link                  (SUBSCRIPTION not active)
```

App-Proxy URLs are signed by Shopify; the verified shop is read from the proxy session, **not** from `?shop=` query, so a malicious storefront cannot mint tokens for another shop's shopper.

## Webhooks

The Shopify app subscribes to:

| Topic | Behaviour |
| --- | --- |
| `app/uninstalled` | Mark the shop inactive (data retained 30 days for re-install). |
| `orders/paid` | Grant credits to the shopper for `CREDITS_WITH_PURCHASE`. |
| `app_subscriptions/update` | Activate / deactivate `SUBSCRIPTION` model. |
| `customers/data_request` | Privacy compliance — return stored data (or empty). |
| `customers/redact` | Privacy compliance — hard-delete the matching record. |
| `shop/redact` | Privacy compliance — hard-delete every row tied to the shop. |

The app also receives webhooks **from** Genvoris (`end_customer.quota_exhausted`, `plan.updated`, etc.) at the same `/webhooks` endpoint, signed with HMAC-SHA256 in [the standard format](../api/webhooks#signature-header).

Idempotency: every Shopify `webhook_id` and Genvoris event id is recorded internally — replays are no-ops.

## Two-layer credit accounting

```
L1   Store ↔ Genvoris portal
     • Merchant buys credit packs / subscription on genvoris.org
     • Every try-on debits the shop's pool via /api/tryon/track
     • If exhausted → portal returns 402 → widget shows "service paused"

L2   Shopper ↔ Store (this app)
     • Each model defines its own per-shopper quota
     • /apps/genvoris/credits/use atomically decrements before /api/tryon
     • Decrement is rolled back if /api/tryon returns non-2xx
     • 402 end_customer_quota → widget shows the model-appropriate UX
```

Both layers are checked **before** any AI quota is spent.

## Limits & caveats

- `orders/paid` requires Shopify's **Protected Customer Data** approval — accept it on install. The rest of the app keeps working without it; only `CREDITS_WITH_PURCHASE` is gated.
- Shopify storefront shoppers are tracked as Genvoris end-customer records (with `externalId: shopify_<id>`) so they are isolated from other stores' shoppers.

## Support

Email **support@genvoris.org** or reply on the Shopify App Store listing.
