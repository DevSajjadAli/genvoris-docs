---
sidebar_position: 3
title: Customers
description: Manage end-customers and their plan assignments.
---

# Customers

End-customers are the users of **your** store. You create them when your billing system records a successful subscription.

Base URL: `https://genvoris.org/api/v1` — all endpoints require `Authorization: Bearer <store_api_key>`.

## Create or upsert

```http
POST /customers
```

```json
{
  "externalId": "user_42",
  "email": "shopper@example.com",
  "planId": "pln_xxxxxxxx",
  "metadata": { "stripe_subscription_id": "sub_..." }
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `externalId` | string | yes | **Your** stable id. Unique per store — re-POSTing upserts and rolls the period forward. |
| `email` | string | no | Optional, for your reporting |
| `planId` | string | no | Plan id; unset = no quota = every try-on returns 402 |
| `metadata` | object | no | Free-form JSON, returned on read |

The endpoint is **idempotent** — call it on every subscribe / renew without checking existence first.

## List customers

```http
GET /customers?status=ACTIVE&limit=50&cursor=ec_abc
```

| Param | Default | Description |
| --- | --- | --- |
| `status` | none | `ACTIVE`, `PAUSED`, or `CANCELLED` |
| `limit` | 50 | 1–200 |
| `cursor` | none | Pagination cursor returned by the previous page |

```json
{
  "data": [/* customers, includes nested plan */],
  "next_cursor": "ec_xyz"
}
```

## Read one customer

```http
GET /customers/{id}
```

Includes the plan and the last 12 usage rows.

## Update a customer

```http
PATCH /customers/{id}
```

```json
{
  "email": "new@example.com",
  "planId": "pln_other",
  "status": "PAUSED",
  "resetPeriod": true
}
```

| Field | Notes |
| --- | --- |
| `email` | Pass `null` to clear |
| `planId` | Pass `null` to detach the plan (subsequent try-ons → 402 `no_plan`) |
| `status` | `ACTIVE` / `PAUSED` / `CANCELLED` — `PAUSED` and `CANCELLED` block try-ons |
| `metadata` | Pass `null` to clear |
| `resetPeriod` | When `true`, sets `periodStart=now`, `periodEnd=now+30d` |

## Cancel a customer

```http
DELETE /customers/{id}
```

Soft cancel — preserves usage history. Future try-ons return 402 `cancelled`.

## Read usage

```http
GET /customers/{id}/usage
```

Returns the customer's plan, current-period quota state, and the last 24 usage buckets.

```json
{
  "data": {
    "customer_id": "ec_abc",
    "external_id": "user_42",
    "plan": { "id": "pln_xxxx", "name": "Pro", "monthlyTryOns": 100 },
    "status": "ACTIVE",
    "period_start": "2026-04-28T00:00:00.000Z",
    "period_end":   "2026-05-28T00:00:00.000Z",
    "current": { "used": 32, "limit": 100, "remaining": 68, "ok": true },
    "history": [/* per-period */]
  }
}
```
