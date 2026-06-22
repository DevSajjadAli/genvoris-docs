---
sidebar_position: 3
title: WordPress / WooCommerce
description: Native WordPress plugin — connect with one click, pick a pricing model, no theme edits.
---

# WordPress / WooCommerce

The **Genvoris Virtual Try-On** WordPress plugin turns the universal REST flow described in [Custom integration](./custom) into a one-click connect for any WooCommerce store. It handles connect, widget injection, monetisation, per-shopper quota, payments, and WooCommerce Subscriptions hooks — you only choose how shoppers should pay.

> Listing: [WordPress.org → Genvoris Virtual Try-On](https://wordpress.org/plugins/genvoris-virtual-try-on/)

## What it gives you

- **One-click connect** from the plugin's settings page. The "Connect with Genvoris" button securely bridges your site to genvoris.org and writes the API key + webhook secret back encrypted — no copy/paste of secrets.
- **No theme edits.** The widget injects itself into WooCommerce product pages automatically. Optional Gutenberg block and shortcode (`[genvoris_tryon]`) for custom layouts.
- **Five monetisation models** (pick one in `WooCommerce → Genvoris Try-On → Monetization`):

  | Model | What the shopper does |
  | --- | --- |
  | `FREE_ALL` | Tries on freely. Merchant absorbs the cost. Optional guest mode. |
  | `SUBSCRIPTION` | Buys a WooCommerce Subscriptions product → unlimited try-ons while active. |
  | `CREDITS_WITH_PURCHASE` | Each paid WC order grants N try-on credits (configurable expiry). |
  | `PAY_PER_USE` | Pays per try-on via a one-off WC checkout that grants a time-boxed session. |
  | `FREEMIUM` | First N/month free; afterwards a paid subscription product. |
- **Same-origin REST proxy** for storefront calls — every widget request goes through your own domain at `/wp-json/genvoris/v1/proxy/*`, so the API key never leaves the server.
- **Two-layer accounting** — the plugin debits your Genvoris credit pool *and* meters per-shopper quota inside your site's database.
- **Encrypted secrets at rest** — the API key + webhook secret are stored in `wp_options` using AES-256-CBC keyed off your `AUTH_KEY` + `SECURE_AUTH_KEY` salts.
- **HPOS / custom-order-tables compatible.** Uses the WooCommerce high-level order API — no direct `wp_postmeta` queries.

## Install

1. From `Plugins → Add New`, search **Genvoris Virtual Try-On** and click **Install** → **Activate**.
2. Go to **WooCommerce → Genvoris Try-On → General**.
3. Click **Connect with Genvoris** and authorise on genvoris.org. You will bounce back to your wp-admin; the plugin exchanges the one-time token for an API key + webhook secret and stores them encrypted.
4. Open **Monetization**, pick a model, save. For `FREEMIUM` and `SUBSCRIPTION` you map an existing WooCommerce Subscriptions product — Woo's product catalogue stays the source of truth.
5. (Optional) Open **Widget** to tweak placement, button text, and whether the floating button appears on product pages.

That's it. Visit any product page on your storefront — the widget loads and behaves according to your chosen model.

## Requirements

|                                | Minimum                                      | Tested up to |
| ------------------------------ | -------------------------------------------- | ------------ |
| WordPress                      | 6.0                                          | 6.9          |
| PHP                            | 8.0                                          | 8.3          |
| WooCommerce                    | 7.0                                          | 9.5          |
| WooCommerce Subscriptions      | (only for `SUBSCRIPTION` / `FREEMIUM`)       | 6.x          |

The plugin **refuses to load without WooCommerce active**. Subscriptions is only required if you pick a model that needs it.

## Storefront request flow

```
Product page
       │
       │  GET /wp-json/genvoris/v1/status?product_id=…
       ▼  (cookie auth + X-WP-Nonce, same-origin)
WordPress
       │
       │  Resolves the WC customer + monetisation model,
       │  ensures the end-customer at the portal, calls:
       ▼
genvoris.org /api/v1/customers/{id}/usage
       │
       ▼
JSON: { canTryOn, ctaType, remaining, sessionToken, … }
       │
       ▼
Widget chooses one of:
 • Show "Try On" button       (canTryOn = true)
 • Redirect to WC checkout    (PAY_PER_USE)
 • Show upgrade banner        (FREEMIUM exhausted)
 • Show "Subscribe" link      (SUBSCRIPTION not active)
       │
       ▼
On click: POST /wp-json/genvoris/v1/proxy/api/analyze
          POST /wp-json/genvoris/v1/proxy/api/tryon
       │  (same-origin proxy — WordPress injects the
       │   API key server-side; the browser never sees it)
       ▼
Genvoris returns the generated image
```

Every storefront request is **same-origin** and authenticated with a `wp_rest` nonce. Guests get a generic status payload without a nonce; only logged-in shoppers can mint a session token or call the proxy.

## REST endpoints the plugin adds

All under `/wp-json/genvoris/v1/`. Server-to-server only — none expose the API key.

| Method + path | Purpose | Auth |
| --- | --- | --- |
| `GET /status` | Quota + CTA snapshot for the current viewer. | Cookie + nonce (guest fallback). |
| `POST /session` | Mint a 15-minute Genvoris session token for the current shopper. | Cookie + nonce. |
| `POST /credits/use` | Decrement local credits *before* the upstream try-on call (rolled back on non-2xx). | Cookie + nonce. |
| `POST /checkout` | Build the WC checkout for `PAY_PER_USE`. | Cookie + nonce. |
| `POST /proxy/{path}` | Forward to the Genvoris API with the encrypted API key. | Cookie + nonce + admin allow-list for non-public paths. |
| `GET /nonce` | Cheap nonce refresh for long-lived widget sessions. | Cookie. |
| `POST /oauth/callback` | One-shot exchange for the connect `token + state`. | Admin (`manage_woocommerce`). |

## WooCommerce hooks

Subscriptions, orders, refunds, and shopper lifecycle are wired automatically:

| Action | Behaviour |
| --- | --- |
| `woocommerce_subscription_status_active` | Set `is_subscribed=1` on the local shopper row. |
| `woocommerce_subscription_status_cancelled` / `_expired` / `_on-hold` | Clear `is_subscribed`. |
| `woocommerce_order_status_completed` | For `CREDITS_WITH_PURCHASE`, grant `credits_per_order` to the buyer with optional expiry. |
| `woocommerce_order_refunded` | Roll back credits or revoke `PAY_PER_USE` sessions for the refunded order. |
| `delete_user` | Detach the local shopper row (kept for audit; can be hard-purged via uninstall). |

The plugin also receives webhooks **from** Genvoris (`tryon.completed`, `customer.quota_exhausted`, `credit.low_balance`, plus legacy aliases such as `end_customer.quota_exhausted`) at `/wp-json/genvoris/v1/webhook`, verified with HMAC-SHA256 (constant-time comparison + 5-minute clock-skew window). See [the standard webhook format](../api/webhooks#signature-header).

Idempotency: every Genvoris event id is recorded in `wp_genvoris_processed_events`. Replays are no-ops.

### Quick Try-On on collection cards

Enable the **Quick Try-On on cards** checkbox in *Genvoris → Widget settings* to add a compact circular icon button to every product card on Shop / category / tag / product-archive pages.

On click, the icon fetches the product's images via the standard WC REST endpoint and opens the try-on modal directly. If anything fails (REST disabled, stale nonce, no product images, widget still loading) it falls back to navigating to the product page with `?genvoris_tryon=1`; the loader on the destination page auto-opens the modal once it has booted, then strips the flag from the URL.

The behaviour is off by default; enabling it has zero impact on product-page rendering.

## Two-layer credit accounting

```
L1   Site ↔ Genvoris portal
     • Merchant buys credit packs / subscription on genvoris.org
     • Every try-on debits the site's pool via /api/tryon/track
     • If exhausted → portal returns 402 → widget shows "service paused"

L2   Shopper ↔ Site (this plugin)
     • Each model defines its own per-shopper quota
     • /wp-json/genvoris/v1/credits/use atomically decrements before /api/tryon
     • Decrement is rolled back if /api/tryon returns non-2xx
     • 402 end_customer_quota → widget shows the model-appropriate UX
```

Both layers are checked **before** any AI quota is spent.

## Data sent to Genvoris

Disclosed verbatim in the plugin's `readme.txt` under `== External services ==`:

| When | Endpoint | Data |
| --- | --- | --- |
| Connect (once) | `genvoris.org/oauth/wordpress` | Site URL, site name, admin email, return URL, platform=`wordpress`, plugin version. |
| Status check (per page view) | `genvoris.org/api/v1/customers/{id}/usage` | Shopper id (`wp_<user_id>`), optional email, metadata (`source: wordpress`, `wp_user_id`, `site_url`). |
| Try-on (per shopper interaction) | `api.genvoris.org/api/analyze`, `/api/tryon` | Uploaded photo bytes, product reference (id / title / image URL / page URL), API key (server-side header only). |

WordPress passwords, payment details, and order line items are **never** sent.

## Security model

The plugin's audit checklist (the WordPress.org submission gate) covers:

- **Encrypted secrets** — the API key + webhook secret are encrypted with AES-256-CBC keyed off `AUTH_KEY + SECURE_AUTH_KEY`. Raw secrets never hit disk in plaintext.
- **Capability checks** — every admin POST runs through the WooCommerce manager capability.
- **Nonce verification** — every admin form uses WordPress nonces; every REST mutation requires `X-WP-Nonce` in addition to cookie auth.
- **HMAC-verified webhooks** — incoming Genvoris webhooks use constant-time comparison with a clock-skew window.
- **Prepared SQL** — every direct query uses `$wpdb->prepare`. Uninstall's `DROP TABLE` only interpolates a literal `$wpdb->prefix`.
- **No `eval`, no remote PHP, no obfuscation** — `base64_*` is used only to encode the binary IV+ciphertext blob, documented inline.
- **Rate limiting** — `/status` is capped at 120 requests/min and `/session` at 30 requests/min per IP+user.

Rotating the WordPress salts (`AUTH_KEY` / `SECURE_AUTH_KEY`) invalidates every encrypted secret and forces a re-connect — coordinate before rotating.

## Uninstall

Plugin **deactivation** keeps everything (so you can re-enable without losing shopper state).

Plugin **uninstall** (the red "Delete" link under Plugins) runs `uninstall.php` which drops:

- All `genvoris_*` options (model, config, encrypted secrets, widget settings, connect state).
- All `genvoris_*` transients.
- The `{$wpdb->prefix}genvoris_customers`, `{$wpdb->prefix}genvoris_credits`, `{$wpdb->prefix}genvoris_processed_events` tables.

This is idempotent — re-running on an already-clean DB is a no-op.

## Limits & caveats

- **WooCommerce is required.** The plugin refuses to load without it; the try-on flow keys off `WC_Customer` and `WC_Order`.
- **WooCommerce Subscriptions** is a separate paid plugin. The `SUBSCRIPTION` and `FREEMIUM` models depend on it. `CREDITS_WITH_PURCHASE`, `PAY_PER_USE`, and `FREEMIUM` (credits side) work with vanilla WC.
- WordPress shoppers are tracked as Genvoris end-customer records (`externalId: wp_<user_id>`) so they are isolated from other sites' shoppers.
- Rotating WordPress salts invalidates every stored secret — every site would need to re-connect. Don't rotate without a coordinated migration.

## Support

Email **support@genvoris.org** or open a thread on the WordPress.org plugin support forum.
