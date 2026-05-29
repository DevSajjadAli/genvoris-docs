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

## Domain restriction (browser-only defense)

API keys can be restricted to specific origins (`*.example.com` syntax). The widget enforces this using the `Origin` header that browsers attach to cross-origin requests — and which **a browser will not let page JavaScript forge** on a cross-origin call.

:::warning This is a defense-in-depth layer, not your primary control
Domain restriction only stops *browser-originated* abuse. It does **not** protect against a leaked key replayed from a server, a script, or `curl`, because any non-browser client can send an arbitrary `Origin` header. **The secrecy of your API key is the primary control.** Keep `gvk_live_…` keys server-side, rotate them if exposed, and treat domain allow-lists as a convenience that blocks casual copy-paste theft — not as authentication.
:::

## Subresource Integrity (SRI) pinning

The unversioned `https://api.genvoris.org/widget.js` URL always serves the latest build. For high-trust storefronts, pin a specific versioned build and verify it with an integrity hash so a compromised CDN cannot silently swap your widget for hostile code:

```html
<script
  src="https://api.genvoris.org/widget-1.4.2.js"
  integrity="sha384-REPLACE_WITH_PUBLISHED_HASH"
  crossorigin="anonymous"
  defer
  data-api-key="gvk_live_xxxxxxxx"
></script>
```

Fetch the current version and its hash programmatically:

```
GET https://api.genvoris.org/widget-hash
→ { "version": "1.4.2", "sha384": "sha384-…" }
```

Rotate the `integrity` value on **every** widget version bump — a stale hash blocks the load. `crossorigin="anonymous"` is required for the browser to run integrity checks on a cross-origin script. See [Widget → Subresource Integrity](./api/widget.md#subresource-integrity-recommended).

## JWT algorithm pinning (RS256)

Session tokens are signed with **RS256** only. If you verify tokens yourself (offline, against our JWKS), you **must pin the algorithm** and reject anything else:

```js
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://genvoris.org/.well-known/jwks.json'));

const { payload } = await jwtVerify(token, JWKS, {
  algorithms: ['RS256'],          // never omit — blocks alg=none / HS256 confusion
  issuer: 'https://genvoris.org',
  audience: 'genvoris-widget',
});
```

Never trust the `alg` value from the token header. A verifier that accepts `alg: none` or an HMAC algorithm can be tricked into validating a forged token using the public key as an HMAC secret. Always supply an explicit allow-list of `['RS256']`.

## Token revocation (JTI)

Every session token carries a unique `jti` claim. Tokens are short-lived (15 min default), but if one is suspected compromised — or an end-customer logs out — you can revoke it immediately rather than waiting for natural expiry:

```
DELETE /api/v1/customers/{customerId}/sessions/{jti}
```

or with the Node SDK:

```js
await genvoris.sessions.revoke({ customerId: 'ec_abc', jti: 'a1b2c3…' });
```

The `jti` is added to a server-side revocation list and rejected on the next try-on even though its signature and expiry are otherwise still valid. The call is idempotent. Revoked entries are pruned automatically once the token's original expiry has passed. See [Sessions → Revoking a session](./api/sessions.md).

## Rate limits

All limits are per API key unless noted. Exceeding a limit returns `429` with a `Retry-After` header; the generic body is `{ "error": "rate_limited" }`.

| Endpoint / action | Limit |
| --- | --- |
| Failed authentication attempts | 20 per 5 min per IP (key locked after 50 consecutive failures) |
| `POST /api/v1/customers` (create) | 100 per hour |
| `POST /api/v1/customers/{id}/sessions` (mint) | 1 000 per hour |
| Unique `externalId`s seen | alert at 50/hour, auto-suspend at 500/hour |
| Try-on generation (Python backend) | 20 per min, 200 per hour, per IP |
| Credit burn safety | alert at 50% in &lt;1h; auto-suspend at 100% in &lt;30 min |

These thresholds protect against a leaked key being drained before you notice. If a key is auto-suspended you'll receive an email; rotate the key and re-enable from the dashboard.

## Transport

All endpoints are HTTPS-only with HSTS (`max-age=63072000; includeSubDomains; preload`). Plain HTTP is redirected.

## Reporting a vulnerability

Email **security@genvoris.org**. Please do not disclose security topics in public forums. We respond within 48 hours and run a coordinated disclosure timeline. A machine-readable contact is published at `https://genvoris.org/.well-known/security.txt`.
