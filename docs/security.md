---
sidebar_position: 9
title: Security
description: How we keep your store and your customers safe.
---

# Security

## Auth

- **Store API keys** are 24-byte random tokens, hashed with SHA-256 at rest, prefixed for visual identification (`gvk_live_…`). We never store the plaintext after issuance.
- **Session tokens** are RS256 JWTs with 15-minute default lifetime. Public key published as JWKS (`https://genvoris.org/.well-known/jwks.json`) for offline verification by your own code or plugins.

## Data we hold

- Your store account (email, plan, credits).
- Your end-customers' `externalId`, optional `email`, and per-period try-on counts.
- A `metadata` JSON blob you optionally attach.

We do **not** hold:

- Payment instruments — L1 (store ↔ Genvoris) is handled by a regulated Merchant-of-Record provider; L2 (shopper ↔ your store) is handled entirely by your own billing system.
- Try-on imagery — generated photos and uploaded selfies are not retained; we keep only counts, sizes, and timing.

## Domain whitelisting

API keys can be restricted to specific origins (`*.example.com` syntax). The widget enforces this server-side using the `Origin` header (which browsers cannot forge cross-origin).

## Transport

All endpoints are HTTPS-only with HSTS (`max-age=63072000; includeSubDomains; preload`). Plain HTTP is redirected.

## Reporting a vulnerability

Email **support@genvoris.org**. Please do not disclose security topics in public forums. We respond within 48 hours and run a coordinated disclosure timeline.
