---
title: Freemium
slug: /monetization-models/freemium
description: Give each shopper a free monthly quota, then route upgrades through your billing system.
---

# Model 3 — Freemium

## What the shopper experiences

The shopper gets a fixed number of free try-ons per month, such as 3 free tries. After the free quota is used, your storefront shows an upgrade or payment prompt.

## What the store configures in Genvoris

Create two Genvoris plans: one free quota plan and one paid quota plan. Your billing system decides when a shopper moves from the free plan to the paid plan.

## How billing flows

- Shopper → store: free until quota is exhausted, then pays your upgrade price.
- Store → Genvoris: every successful try-on consumes one store credit.
- Genvoris enforces the quota but does not collect the upgrade payment.

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

async function ensurePlan(externalId: string, name: string, monthlyTryOns: number) {
  return genvoris('/api/v1/plans', {
    method: 'POST',
    body: JSON.stringify({ externalId, name, monthlyTryOns }),
  })
}

app.post('/api/tryon/session', async (req, res) => {
  const freePlan = await ensurePlan('freemium-free', 'Freemium free quota', 3)
  const paidPlan = await ensurePlan('freemium-paid', 'Freemium paid quota', 100)

  const hasPaidUpgrade = await yourBillingSystem.hasActiveUpgrade(req.body.shopperId)
  const planId = hasPaidUpgrade ? paidPlan.id : freePlan.id

  const customer = await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      externalId: req.body.shopperId,
      planId,
      metadata: { model: 'FREEMIUM', paid: hasPaidUpgrade },
    }),
  })

  try {
    const session = await genvoris(`/api/v1/customers/${customer.id}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ productId: req.body.productId }),
    })
    res.json({ token: session.token })
  } catch (err) {
    res.status(402).json({
      error: 'quota_exhausted',
      upgradeUrl: `${process.env.STORE_URL}/tryon/upgrade`,
    })
  }
})
```

## Recommended Genvoris plan tier

Starter for a medium store testing free quotas. Growth when free usage plus upgrades regularly exceed 200 try-ons/month.

## Native platform support

- Shopify app: native free quota; paid upgrade can route through Shopify checkout/subscriptions.
- WordPress plugin: native free quota; paid upgrade can route through WooCommerce product/subscription.
- API: supported on any stack.
