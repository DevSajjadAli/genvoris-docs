---
title: Free for all
slug: /monetization-models/free-for-all
description: Offer virtual try-on to every shopper and absorb the credit cost as a conversion tool.
---

# Model 1 — Free for all

## What the shopper experiences

Every shopper sees the **Try it on** button. Guests and logged-in users can start a try-on without payment, subscription, or quota messaging.

## What the store configures in Genvoris

Create a generous store-wide plan and attach all shoppers to it, or use the legacy single-tenant widget flow if you do not need per-shopper analytics. For better abuse control, we recommend still creating end-customer records keyed to your anonymous session id or logged-in customer id.

## How billing flows

- Shopper → store: no try-on charge.
- Store → Genvoris: every successful try-on consumes one store credit.
- Store absorbs the cost and treats try-on as conversion/return-reduction spend.

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

app.post('/api/tryon/session', async (req, res) => {
  const shopperId = req.body.customerId ?? req.body.anonymousId

  const plan = await genvoris('/api/v1/plans', {
    method: 'POST',
    body: JSON.stringify({
      externalId: 'free-for-all',
      name: 'Free for all shoppers',
      monthlyTryOns: 100000,
    }),
  })

  const customer = await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      externalId: shopperId,
      planId: plan.id,
      metadata: { model: 'FREE_ALL' },
    }),
  })

  const session = await genvoris(`/api/v1/customers/${customer.id}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ productId: req.body.productId }),
  })

  res.json({ token: session.token })
})
```

## Recommended Genvoris plan tier

Free tier for a tiny pilot. Starter or Growth once the button is live on public product pages.

## Native platform support

- Shopify app: native setting.
- WordPress plugin: native setting.
- API: supported on any stack.
