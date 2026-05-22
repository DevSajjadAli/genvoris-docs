---
sidebar_position: 2
title: Shopify
description: Native Shopify app — install, pick a monetisation model, drop one theme block, done.
---

# Shopify

The **Genvoris Virtual Try-On** Shopify app turns the universal REST flow described in [Custom integration](./custom) into a one-click install. It handles OAuth, theme injection, plan creation, end-customer quota, payments, and GDPR webhooks — you choose how you want shoppers to pay.

> Listing: [Shopify App Store → Genvoris Virtual Try-On](https://apps.shopify.com/genvoris-virtual-try-on) (in review)
>
> Source: [`devsajjadali/genvoris-shopify`](https://github.com/devsajjadali/genvoris-shopify)

## What it gives you

- **One-click install** from the Shopify App Store. The OAuth callback automatically provisions your Genvoris portal account and links your store. No second signup.
- **Theme block** for the theme editor — drop "Genvoris Try-On" onto your product template, no `theme.liquid` edits.
- **Five monetisation models** (pick one in `App → Monetization`):
  | Model | What the shopper does |
  | --- | --- |
  | `FREE_ALL` | Tries on freely. Merchant absorbs the cost. |
  | `SUBSCRIPTION` | Buys a recurring subscription product → unlimited try-ons while active. |
  | `CREDITS_WITH_PURCHASE` | Each paid order grants N try-on credits (configurable expiry). |
  | `PAY_PER_USE` | Pays per try-on via a Shopify draft order. |
  | `FREEMIUM` | First N/month free; afterwards a paid subscription product. |
- **App Proxy** for storefront calls — every request from the widget is signed by Shopify (`/apps/genvoris/*`), so we never expose your Genvoris API key to the browser.
- **Two-layer accounting** — the app debits your Genvoris store credit pool *and* meters per-shopper quota inside the app's DB.
- **GDPR webhooks** wired out of the box (`customers/data_request`, `customers/redact`, `shop/redact`).

## Install

1. From the Shopify App Store, click **Add app** and accept the OAuth scopes.
2. The app's **Settings** page is the only thing you have to fill in:
   - Paste your Genvoris store API key (issued in [genvoris.org dashboard](https://genvoris.org/dashboard) under **Integration → API keys**).
   - Click **Test connection**.
3. Open **Monetization**, pick a model, save. For `FREEMIUM` and `SUBSCRIPTION` the app auto-creates the Shopify subscription product **and** the matching Genvoris plan via [`POST /api/v1/plans`](../api/plans).
4. In **Online Store → Themes → Customise**, add the **Genvoris Try-On** block to your product template. Save.

That's it. Visit any product page — the widget loads and behaves according to your chosen model.

## Required scopes

Listed verbatim in the Partner Dashboard for App Store review:

| Scope | Why |
| --- | --- |
| `read_products` / `write_products` | List products in admin UI; auto-create the subscription product + `SellingPlanGroup` for paid plans. |
| `read_orders` / `write_orders` | Read paid orders for `CREDITS_WITH_PURCHASE`; create draft orders for `PAY_PER_USE`. **Triggers Protected Customer Data review** — apply at [shopify.dev/docs/apps/launch/protected-customer-data](https://shopify.dev/docs/apps/launch/protected-customer-data). |

We deliberately **do not** request `read_customers` / `write_customers`. The App Proxy already supplies `logged_in_customer_id` for quota lookups, and the app never queries or mutates customer records via the Admin API.

## Storefront request flow

```
Storefront product page
       │
       │  /apps/genvoris/status?logged_in_customer_id=…
       ▼  (signed by Shopify App Proxy)
tryon.genvoris.org           ← Remix routes
       │
       │  Reads the verified shop from the proxy session,
       │  decrypts the stored Genvoris API key, calls:
       ▼
genvoris.org /api/v1/customers/{id}/usage
       │
       ▼
JSON: {canTryOn, ctaType, remaining, …}
       │
       ▼
Widget chooses one of:
 • Show "Try On" button       (canTryOn = true)
 • Redirect to /apps/genvoris/checkout    (PAY_PER_USE)
 • Show upgrade banner with plan URL      (FREEMIUM exhausted)
 • Show "Subscribe" link                  (SUBSCRIPTION not active)
```

App-Proxy URLs are signed by Shopify; the verified shop is read from the proxy session, **not** from `?shop=` query, so a malicious storefront cannot mint tokens for another shop's customer.

## Webhooks

The Shopify app subscribes to:

| Topic | Behaviour |
| --- | --- |
| `app/uninstalled` | Mark the shop inactive (data retained 30 days for re-install). |
| `orders/paid` | Credit the shopper for `CREDITS_WITH_PURCHASE`. |
| `app_subscriptions/update` | Activate / deactivate `SUBSCRIPTION` model. |
| `customers/data_request` | Privacy compliance — return stored data (or empty). |
| `customers/redact` | Privacy compliance — hard-delete the matching record. |
| `shop/redact` | Privacy compliance — hard-delete every row tied to the shop. |

The app **also** receives webhooks from Genvoris (`end_customer.quota_exhausted`, `plan.updated`, etc.) at the same `/webhooks` endpoint, signed with HMAC-SHA256 in [the standard format](../api/webhooks#signature-header). The shop is encoded in the registration URL as `?shop=…` — no extra header or DB column is needed.

Idempotency: every Shopify `webhook_id` and Genvoris event id is recorded in `ProcessedWebhookEvent`. Replays are no-ops.

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

## Self-hosting (advanced)

If you'd rather host the Shopify-side service yourself instead of using the public listing — for example to run on the same Coolify cluster as your portal — the source is [open](https://github.com/devsajjadali/genvoris-shopify) and ships with:

- A multi-stage `Dockerfile` (Express + Remix runtime).
- Prisma schema for `Session`, `ShopConfig`, `MonetizationConfig`, `ShopPlan`, `ShopCustomer`, `TryonPayment`, `ProcessedWebhookEvent`.
- A `shopify.app.toml` you only need to repoint to your domain.

Run `shopify app deploy` from your fork to register the URLs / scopes / webhooks against a fresh Partner Dashboard app, then deploy the container behind a public hostname (Coolify, Railway, Fly, plain Docker — any of them work).

See the repo's [`README.md`](https://github.com/devsajjadali/genvoris-shopify/blob/main/README.md) for the full deployment guide, environment variables, troubleshooting table and App-Store-submission checklist.

## Limits & caveats

- `orders/paid` requires Shopify's **Protected Customer Data** approval — apply during App Store review. The rest of the app keeps working without it; only `CREDITS_WITH_PURCHASE` is gated.
- Shopify storefront customers are **not** Clerk users on the Genvoris side. They live as `ShopCustomer` rows in the app's DB and as `EndCustomer` rows (with `externalId: shopify_<id>`) in the portal.
- Rotating the app's `ENCRYPTION_KEY` invalidates every stored Genvoris API key — every merchant would have to re-paste theirs. Don't rotate without a coordinated migration.

## Support

Open an issue at [`devsajjadali/genvoris-shopify`](https://github.com/devsajjadali/genvoris-shopify/issues) or email **support@genvoris.org**.
