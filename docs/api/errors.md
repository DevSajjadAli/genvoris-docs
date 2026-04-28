---
sidebar_position: 6
title: Errors
description: Every error code, what it means, what to do.
---

# Errors

Every error response is JSON shaped like:

```json
{ "error": "machine_code", "detail": "human-readable info" }
```

## Standard codes

| HTTP | `error` | What's wrong | Fix |
| --- | --- | --- | --- |
| 400 | `invalid_body` | Request body failed schema validation | Read `detail` for the offending path |
| 401 | `unauthorized` | Missing or malformed `Authorization` header | Send `Bearer gvk_live_…` |
| 401 | `invalid_key` | API key not found / deactivated | Issue a new key in the portal |
| 401 | `invalid_session_token` | Session JWT failed verify or expired | Mint a fresh one |
| 402 | `credit_limit_reached` | Your store credit pool is empty | Buy a credit pack |
| 402 | `end_customer_quota` | End-customer hit their plan quota | Show paywall; PATCH `resetPeriod` on next renewal |
| 403 | `account_inactive` | Store account suspended | Contact support |
| 403 | `customer_inactive` | The customer is `PAUSED` or `CANCELLED` | PATCH them back to `ACTIVE` |
| 403 | `domain_not_allowed` | Origin not on the API key's allowlist | Add the host in the portal |
| 403 | `token_store_mismatch` | JWT was minted by a different store | Use the JWT minted with **your** API key |
| 403 | `plan_not_found` | Plan id doesn't belong to the caller | Verify the id |
| 404 | `not_found` | Customer / plan id unknown to the caller | Verify the id |

## `end_customer_quota` reasons

`/api/tryon/track` includes a `reason` when it returns 402 with `error=end_customer_quota`:

| `reason` | Meaning |
| --- | --- |
| `quota_exhausted` | Plan limit reached this period |
| `no_plan` | Customer has no plan attached, or plan is inactive |
| `paused` | Customer status is `PAUSED` |
| `cancelled` | Customer status is `CANCELLED` |

## Idempotency

Most write endpoints are naturally idempotent:

- `POST /customers` upserts on `(storeUserId, externalId)`
- Plan / customer `PATCH` is by definition idempotent

`POST /plans` is **not** idempotent — sending it twice creates two plans. Track plan ids on your side.

## Rate limits

There is currently no public rate limit. We will publish exact numbers before we enforce them; for now keep concurrency reasonable (≤ 50 RPS per store).
