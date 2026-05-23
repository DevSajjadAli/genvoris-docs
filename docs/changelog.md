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

## 2026-05-24 — SDKs

### `@genvoris/node` v1.0.0
- Initial release of the official TypeScript/Node SDK on npm.
- Promise-based client wrapping the Plans, Customers, Sessions and
  Webhooks REST endpoints.
- Built-in JWT minting helper for short-lived widget sessions.

### `genvoris/laravel-sdk` v1.0.0
- Initial Composer package for Laravel 10/11/12.
- `Genvoris\Client` service container resolution with config validation
  raised at boot (not at first call) so misconfiguration fails loudly.

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
