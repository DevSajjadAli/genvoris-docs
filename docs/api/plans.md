---
sidebar_position: 2
title: Plans
description: Define the monthly try-on quotas you sell to your end-customers.
---

# Plans

Plans are the SKUs your store sells. Each plan defines a monthly try-on quota for any end-customer assigned to it.

Base URL: `https://genvoris.org/api/v1`

All endpoints require `Authorization: Bearer <store_api_key>`.

## List plans

```http
GET /plans?include_inactive=false
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `include_inactive` | bool | `false` | Include disabled plans |

```json
{
  "data": [
    {
      "id": "pln_abc",
      "name": "Pro",
      "monthlyTryOns": 100,
      "externalPriceId": "price_1NXXXX",
      "active": true,
      "createdAt": "2026-04-28T03:18:00.000Z",
      "updatedAt": "2026-04-28T03:18:00.000Z"
    }
  ]
}
```

## Create a plan

```http
POST /plans
Content-Type: application/json
```

```json
{
  "name": "Pro",
  "monthlyTryOns": 100,
  "externalPriceId": "price_1NXXXX",
  "active": true
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | 1–80 chars |
| `monthlyTryOns` | int | yes | 1–1,000,000 |
| `externalPriceId` | string | no | Map back to your billing price id |
| `active` | bool | no | Defaults to `true` |

Returns `201 Created` with the plan body.

## Read a single plan

```http
GET /plans/{id}
```

## Update a plan

```http
PATCH /plans/{id}
Content-Type: application/json
```

All fields optional. You may e.g. flip `active`, raise `monthlyTryOns` (existing customers get the new quota at next period roll), or rename the plan.

## Disable a plan

```http
DELETE /plans/{id}
```

Soft-disable. Existing end-customers on the plan keep their quota until you cancel them or change their plan. The plan stops appearing in `GET /plans` unless you pass `include_inactive=true`.

## Errors

| HTTP | `error` | Meaning |
| --- | --- | --- |
| 400 | `invalid_body` | Schema mismatch — `detail` describes |
| 401 | `unauthorized` / `invalid_key` | Bad / missing API key |
| 403 | `account_inactive` | Your store account is suspended |
| 404 | `not_found` | Plan id doesn't belong to you |
