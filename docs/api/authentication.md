---
sidebar_position: 1
title: Authentication
description: Two auth flavours — store API keys for server-to-server, session JWTs for the browser.
---

# Authentication

Genvoris exposes two distinct auth surfaces. Use the right one for the right caller.

## 1. Store API key (server-to-server)

Used by **your backend** to manage plans, customers, and mint sessions. Never ship this key to the browser.

```http
Authorization: Bearer gvk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Issued in the Genvoris portal under **Integration → API keys**.
- Hashed with SHA-256 server-side; we never see the plaintext after issuance.
- Optionally domain-restricted (only the widget side honours this).
- Rotate any time — old keys can be deactivated independently.

If the key is missing, malformed, deactivated, or the underlying account is suspended:

```json
{ "error": "unauthorized" | "invalid_key" | "account_inactive" }
```

## 2. Session JWT (browser-side)

Used by widget code in the end-customer's browser. **Minted by you** server-to-server, then passed to the page:

```bash
POST /api/v1/customers/{id}/sessions
Authorization: Bearer $GENVORIS_API_KEY

{ "expires_in": 900 }       # optional — default 900s, max 3600s
```

Returned as a signed RS256 JWT:

```
header.payload.signature
```

with these claims:

| Claim | Value |
| --- | --- |
| `sub` | end-customer id (`ec_…`) |
| `sid` | your store user id |
| `pid` | plan id at mint time |
| `iss` | `https://genvoris.org` |
| `aud` | `genvoris-widget` |
| `iat` / `exp` | unix seconds |
| `jti` | unique token id |

## Verifying tokens yourself

The public key is published as a JWKS document, cached for 1 hour:

```
GET https://genvoris.org/.well-known/jwks.json
```

Useful for plugin code paths that want to introspect a token without hitting our API.

## TLS

All endpoints are HTTPS-only. Plain HTTP requests are redirected.
