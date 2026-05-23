---
title: Purchase unlock
slug: /monetization-models/purchase-unlock
description: Grant shoppers try-on credits automatically after purchases to encourage repeat visits.
---

# Model 5 — Purchase unlock

## What the shopper experiences

After placing an order, the shopper receives a try-on allowance, such as 5 try-ons unlocked for the next 30 days. Returning shoppers see their available try-on credits in your storefront.

## What the store configures in Genvoris

Create a shopper plan or custom quota that represents earned credits. Your order webhook grants credits when orders are paid and optionally revokes them on refunds.

## How billing flows

- Shopper → store: pays for products as usual.
- Store → shopper: grants try-on credits as a loyalty reward.
- Store → Genvoris: each redeemed try-on consumes one store credit.

## Complete code example

```ts
import express from 'express'

const app = express()
app.use(express.json())

const GEN_VORIS_API_KEY = process.env.GENVORIS_API_KEY!
const GEN_VORIS_BASE = 'https://genvoris.org'

async function genvoris(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GEN_VORIS_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${GEN_VORIS_API_KEY}`,
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

app.post('/webhooks/orders/paid', async (req, res) => {
  const order = req.body
  const shopperId = order.customer.id

  const earnedPlan = await genvoris('/api/v1/plans', {
    method: 'POST',
    body: JSON.stringify({
      externalId: 'purchase-unlock-5',
      name: 'Five try-ons earned per purchase',
      monthlyTryOns: 5,
    }),
  })

  await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      externalId: shopperId,
      planId: earnedPlan.id,
      resetPeriod: true,
      metadata: {
        model: 'PURCHASE_UNLOCK',
        orderId: order.id,
        expiresInDays: 30,
      },
    }),
  })

  res.json({ ok: true })
})

app.post('/api/tryon/session', async (req, res) => {
  const customer = await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({ externalId: req.body.shopperId, metadata: { model: 'PURCHASE_UNLOCK' } }),
  })

  const session = await genvoris(`/api/v1/customers/${customer.id}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ productId: req.body.productId }),
  })

  res.json({ token: session.token })
})
```

## Recommended Genvoris plan tier

Pro or Business for high-volume retailers and loyalty-driven brands. Growth can work for a smaller pilot.

## Native platform support

- Shopify app: native after `orders/paid` access is approved by Shopify.
- WordPress plugin: native through WooCommerce completed-order hooks.
- API: supported on any order system that can call your server after payment.
