---
id: changelog
title: Changelog
sidebar_label: Changelog
sidebar_position: 99
description: Every shipped change to the Genvoris platform, SDKs and documentation, newest first.
---

# Changelog

Every shipped change to the Genvoris platform, SDKs and documentation,
newest first. Dates are in `YYYY-MM-DD` (UTC).

Entries are derived from the git history of the four production
repositories — `genvoris-portal`, `genvoris-docs`, `genvoris-node`,
`genvoris-laravel` — and the integration plugins (`genvoris-shopify`,
`genvoris-wordpress`).

---

## 2026-06-16 — Docs overhaul + SDK fixes

### Documentation
- All API reference docs cross-checked against actual source code for accuracy.
- **[Node SDK reference](./api/sdk-node)** — complete rewrite: decorated jitter (not full jitter),
  all missing methods documented (`cancel`, `usage`, `sessions`, `revoke`, `archive`, `delete`, `test`),
  fresh `AbortController` per retry detailed, webhook verify example uses canonical header name.
- **[Laravel integration](./integrations/laravel)** — comprehensive update: full config table,
  resource method signatures, security features of the proxy (method whitelist, path traversal guard,
  origin enforcement, 502 handling), complete event table with descriptions, idempotency details,
  error class hierarchy, testing section, dedicated webhook verification section.
- **[Webhook docs](./api/webhooks)** — verification examples now reference the SDK's built-in
  `WebhooksResource.verify()` and the Laravel package's auto-verifying middleware before showing
  manual code. Node manual example uses `node:crypto` import path.
- **[Changelog](./changelog)** — corrected `genvoris/laravel-sdk` → `genvoris/laravel`.
  Added v1.0.1 release notes for `@genvoris/node`.
- **Docusaurus config** — added Laravel integration to footer.
- **Cross-doc linking** — consistent relative links throughout.

### `@genvoris/node` v1.0.1
- Fixed error-code/message fallback when the API returns empty-string fields.
- Added `Accept: application/json` default header.
- Added hex character validation in `hexToBytes()` for webhook verification.
- Fixed webhook test payload `event` → `type` field name.
- Added `@types/node` dev dependency; removed fragile custom crypto shims.
- Pinned retry backoff to **decorated jitter** (`0.7 + random() * 0.6` spread)
  for better de-correlation across concurrent clients.

### `genvoris/laravel` v1.0.0
- Initial Composer package for Laravel 10/11/12.
- Service provider with config validation raised at boot
  (not at first call) so misconfiguration fails loudly.
- `CustomerResource`, `PlanResource`, `SessionResource` — resource-oriented API wrappers with
  automatic `external_id_prefix` handling.
- `HasGenvorisAccess` Eloquent trait for User models.
- Facade with `upsertCustomer()`, `mintSession()`, `listPlans()`, `customerUsage()`.
- `@genvorisWidget`, `@genvorisConfig`, `@genvorisScripts`, `@genvorisTryOnButton` Blade directives.
- `ProxyController` — server-side proxy with path allowlist, origin enforcement, method whitelist.
- `WebhookController` — HMAC-SHA256 verified webhook dispatch with typed Laravel events
  (9 event classes), idempotency via `X-Genvoris-Delivery` dedup (24h window).
- `VerifyGenvorisWebhook` middleware for automatic signature verification.
- `WebhookVerifier` class (stateless, returns bool, never throws).
- 5 Artisan commands: install, test-connection, list-plans, list-customers, webhook-test.
- Optional polymorphic migration for local customer ID caching.
- 40+ tests across unit and feature suites using Orchestra Testbench + PHPUnit.
- Bug fixes: case-insensitive host comparison in proxy, null-safe `Cache::store()` guard,
  204 handling in customer cancel, Content-Type header fix in webhook test command.

---

## 2026-05-24 — SDKs

### `@genvoris/node` v1.0.0
- Initial release of the official TypeScript/Node SDK on npm.
- Promise-based client wrapping the Plans, Customers, Sessions and
  Webhooks REST endpoints.
- Built-in JWT minting helper for short-lived widget sessions.

### `genvoris/laravel` v1.0.0 *(pre-release name: `genvoris/laravel-sdk`)*
- Initial Composer package for Laravel 10/11/12.
- Service provider with config validation raised at boot (not at first call) so misconfiguration fails loudly.

### `@genvoris/node` v1.0.0
- Initial release of the official TypeScript/Node SDK on npm.
- Promise-based client wrapping the Plans, Customers, Sessions and
  Webhooks REST endpoints.
- Built-in JWT minting helper for short-lived widget sessions.

### `@genvoris/node` v1.0.1
- Fixed error-code/message fallback when the API returns empty-string fields.
- Added `Accept: application/json` default header.
- Added hex character validation in `hexToBytes()` for webhook verification.
- Fixed webhook test payload `event` → `type` field name.
- Added `@types/node` dev dependency; removed fragile custom crypto shims.
- Pinned retry backoff to **decorated jitter** (`0.7 + random() * 0.6` spread)
  for better de-correlation across concurrent clients.

### `genvoris/laravel` v1.0.0
- Initial Composer package for Laravel 10/11/12.
- Service provider with config validation raised at boot
  (not at first call) so misconfiguration fails loudly.
- `CustomerResource`, `PlanResource`, `SessionResource` — resource-oriented API wrappers with automatic `external_id_prefix` handling.
- `HasGenvorisAccess` Eloquent trait for User models.
- Facade with `upsertCustomer()`, `mintSession()`, `listPlans()`, `customerUsage()`.
- `@genvorisWidget`, `@genvorisConfig`, `@genvorisScripts`, `@genvorisTryOnButton` Blade directives.
- `ProxyController` — server-side proxy with path allowlist, origin enforcement, and method whitelist.
- `WebhookController` — HMAC-SHA256 verified webhook dispatch with typed Laravel events (9 event classes).
- `VerifyGenvorisWebhook` middleware for automatic signature verification.
- `WebhookVerifier` class (stateless, returns bool, never throws).
- 5 Artisan commands: install, test-connection, list-plans, list-customers, webhook-test.
- Optional polymorphic migration for local customer ID caching.
- Bug fixes: case-insensitive host comparison in proxy, null-safe `Cache::store()` guard,
  204 handling in customer cancel, Content-Type header fix in webhook test command.

---

## 2026-05-21 — Docs hardening

- **Webhook signature verification** — added explicit per-language
  examples (Node, PHP, Python, Ruby) for verifying `X-Genvoris-Signature`
  headers, including the constant-time comparison requirement.
- **Subresource Integrity (SRI)** — widget snippet now documents the
  `integrity` and `crossorigin` attributes and how to pin a release
  hash.
- **`externalId` binding callout** — security section now spells out
  that `externalId` MUST be your immutable internal user ID, never an
  email or any value the end-customer can choose.

---

## 2026-05-18 — Portal

- **JWT algorithm pinning** — all minted session tokens now hard-pin
  `alg: RS256`. The verifier rejects any other value, including `none`,
  before signature checks run.
- **`security.txt`** — RFC 9116 endpoint published at
  `https://genvoris.org/.well-known/security.txt`.
- **Metadata validation** — `customer.metadata` is now capped at 20 keys
  and 4 KB total per record. Larger payloads are rejected with
  `metadata_too_large`.

---

## 2026-05-15 — Billing

- **Prepaid credits** — `prepaidBalanceCents` on the user record;
  topped up via Stripe Checkout with a $5 minimum and no expiry. Once
  the monthly plan quota is exhausted, every try-on debits this balance
  at the plan-specific per-try-on rate.
- **Overage settle cron** — `/api/cron/settle-overage` runs daily and
  invoices accrued overage to the saved payment method for any user
  still on the legacy overage path.

---

## 2026-05-12 — Integrations

- **Shopify app** — feature-complete (OAuth, App Proxy widget, native
  Billing API). Public App Store listing currently in Shopify review.
- **WordPress plugin** — published to the WordPress Plugin Directory.
  Drop-in widget injection on WooCommerce product pages with no theme
  edits.

---

## Older

Pre-launch history is tracked in the individual repository changelogs:

- [`genvoris-portal/CHANGELOG`](https://github.com/DevSajjadAli/genvoris-portal/commits/main)
- [`genvoris-docs/CHANGELOG`](https://github.com/DevSajjadAli/genvoris-docs/commits/main)
- [`genvoris-node/CHANGELOG`](https://github.com/DevSajjadAli/genvoris-node/commits/main)
- [`genvoris-laravel/CHANGELOG`](https://github.com/DevSajjadAli/genvoris-laravel/commits/master)
