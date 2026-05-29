---
sidebar_position: 4
title: Sessions
description: Mint short-lived JWTs that authenticate end-customers from the browser.
---

# Sessions

A **session** is a short-lived RS256 JWT minted by your backend so the end-customer's browser can call the widget API safely.

> Never expose the store API key to the browser. Mint a session instead.

## Mint a session

```http
POST /api/v1/customers/{customerId}/sessions
Authorization: Bearer <store_api_key>
Content-Type: application/json
```

```json
{ "expires_in": 900 }
```

| Field | Default | Range |
| --- | --- | --- |
| `expires_in` | `900` (15 min) | 60 – 3600 seconds |

Response:

```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "expires_at": 1745812345,
  "customer": {
    "id": "ec_abc",
    "external_id": "user_42",
    "plan_id": "pln_xxxx",
    "plan_name": "Pro",
    "monthly_try_ons": 100,
    "period_start": "...",
    "period_end": "..."
  }
}
```

If the customer is paused or cancelled, you get `403 customer_inactive` and no token.

## Revoke a session

If an end-customer logs out, or a token is suspected compromised, revoke it
immediately by its `jti` claim. The token is rejected even though its
signature and `exp` are otherwise still valid.

```http
DELETE /api/v1/customers/{customerId}/sessions/{jti}
Authorization: Bearer <store_api_key>
```

Response:

```json
{ "data": { "jti": "ec_abc-1745811445-rand", "revoked": true } }
```

Notes:

- **Idempotent** — revoking an already-revoked `jti` returns `200`.
- The `jti` must belong to a token issued for one of your own customers
  (it is prefixed with the customer ID); otherwise you get `404 not_found`.
- Revocation entries are retained only until the token's natural expiry
  (max session lifetime is 1 hour), then pruned automatically.

SDK example (`@genvoris/node`):

```ts
await genvoris.sessions.revoke({ customerId: 'ec_abc', jti });
```

## Token shape

```
header.payload.signature
```

Header:

```json
{ "alg": "RS256", "kid": "gv-xxxx", "typ": "JWT" }
```

Payload:

```json
{
  "sub": "ec_abc",
  "sid": "user_xyz",
  "pid": "pln_xxxx",
  "iss": "https://genvoris.org",
  "aud": "genvoris-widget",
  "iat": 1745811445,
  "exp": 1745812345,
  "jti": "ec_abc-1745811445-rand"
}
```

## Verifying tokens (offline)

For plugin code that wants to introspect a token without an extra round-trip, fetch our JWKS:

```
GET https://genvoris.org/.well-known/jwks.json
Cache-Control: public, max-age=3600
```

Use any JOSE library (Node `jose`, Python `python-jose`, PHP `firebase/php-jwt`) to verify with `iss=https://genvoris.org` and `aud=genvoris-widget`.

> Offline verification cannot see revocations. If you revoke tokens, either
> keep `expires_in` short (the default 15 min bounds your exposure) or verify
> online against the widget API for security-sensitive actions.

## Rotation

When we rotate signing keys, the `kid` changes but old tokens stay valid until their natural `exp`. Cache the JWKS for at most one hour to pick up new keys quickly.
