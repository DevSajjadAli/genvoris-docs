---
sidebar_position: 9
title: Security
description: How we keep your store and your customers safe.
---

# Security

## Auth

- **Store API keys** are 24-byte random tokens, hashed with SHA-256 at rest, prefixed for visual identification (`gvk_live_…`). We never store the plaintext after issuance.
- **Session tokens** are RS256 JWTs with 15-minute default lifetime. Public key published as JWKS for offline verification.
- **Try-on backend ↔ portal** uses a constant-time-compared shared secret (`x-internal-secret`).

## Data we hold

- Your store account (email, plan, credits).
- Your end-customers' `externalId`, optional `email`, and per-period try-on counts.
- A `metadata` JSON blob you optionally attach.

We do **not** hold:

- Payment instruments — Paddle is Merchant of Record for L1; your billing system handles L2.
- Try-on imagery — generation happens in the model backend; we keep only counts and timing.

## Domain whitelisting

API keys can be restricted to specific origins (`*.example.com` syntax). The widget enforces this server-side using the `Origin` header (which browsers cannot forge cross-origin).

## Transport

All endpoints are HTTPS-only with HSTS (`max-age=63072000; includeSubDomains; preload`). Plain HTTP is redirected.

## Reporting a vulnerability

Email **support@genvoris.org**. Please do not file public GitHub issues for security topics. We respond within 48 hours and run a coordinated disclosure timeline.
