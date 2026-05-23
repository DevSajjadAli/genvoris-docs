---
title: Subscription
slug: /monetization-models/subscription
description: Sell recurring shopper access while Genvoris enforces the monthly try-on quota.
---

# Model 4 — Subscription

## What the shopper experiences

The shopper subscribes to a try-on membership, such as $4.99/month for a monthly quota or unlimited-feeling access with a fair-use cap.

## What the store configures in Genvoris

Create a plan representing the subscriber quota. Your billing system activates or cancels the shopper's Genvoris customer record based on subscription lifecycle events.

## How billing flows

- Shopper → store: recurring subscription payment through your billing system.
- Store → Genvoris: try-on credits are consumed as subscribers use the widget.
- Genvoris enforces quota and returns quota errors when limits are reached.

## Complete code example

```ts
import express from 'express'
import Stripe from 'stripe'

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature']!, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const shopperId = sub.metadata.shopperId
    const active = ['active', 'trialing'].includes(sub.status)

    const plan = await genvoris('/api/v1/plans', {
      method: 'POST',
      body: JSON.stringify({ externalId: 'tryon-subscription', name: 'Try-on subscriber', monthlyTryOns: 250 }),
    })

    await genvoris('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        externalId: shopperId,
        planId: active ? plan.id : null,
        metadata: { model: 'SUBSCRIPTION', subscriptionId: sub.id, active },
      }),
    })
  }

  res.json({ received: true })
})

app.post('/api/tryon/session', express.json(), async (req, res) => {
  const customer = await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({ externalId: req.body.shopperId, metadata: { model: 'SUBSCRIPTION' } }),
  })

  const session = await genvoris(`/api/v1/customers/${customer.id}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ productId: req.body.productId }),
  })

  res.json({ token: session.token })
})
```

## Recommended Genvoris plan tier

Growth for early subscriptions. Pro or Business if the subscription is bundled into a high-traffic loyalty program.

## Native platform support

- Shopify app: native when using Shopify subscription products; custom subscription systems should use the API.
- WordPress plugin: requires WooCommerce Subscriptions; custom subscription systems should use the API.
- API: supported with Stripe, Paddle, Shopify, WooCommerce, or custom billing.
