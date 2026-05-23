---
title: Pay per try-on
slug: /monetization-models/pay-per-tryon
description: Charge shoppers for each try-on session while Genvoris meters the store's credit pool.
---

# Model 2 — Pay per try-on

## What the shopper experiences

The shopper clicks **Try it on**, sees a small one-time price, pays through your checkout, then receives access to a single try-on session.

## What the store configures in Genvoris

Create a low-quota plan that grants one try-on per paid access order. Your server creates or updates the shopper only after your payment provider confirms payment.

## How billing flows

- Shopper → store: pays your one-time fee, such as $0.99 or $1.49.
- Store → Genvoris: one credit is consumed when the try-on succeeds.
- Genvoris does not see or process the shopper payment.

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

app.post('/api/tryon/checkout', express.json(), async (req, res) => {
  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: process.env.STRIPE_TRYON_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.STORE_URL}/tryon/paid?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.STORE_URL}/products/${req.body.productHandle}`,
    metadata: {
      shopperId: req.body.shopperId,
      productId: req.body.productId,
      model: 'PAY_PER_USE',
    },
  })
  res.json({ url: checkout.url })
})

app.post('/api/tryon/session', express.json(), async (req, res) => {
  const checkout = await stripe.checkout.sessions.retrieve(req.body.checkoutSessionId)
  if (checkout.payment_status !== 'paid') return res.status(402).json({ error: 'payment_required' })

  const shopperId = checkout.metadata!.shopperId!

  const plan = await genvoris('/api/v1/plans', {
    method: 'POST',
    body: JSON.stringify({ externalId: 'pay-per-use-1', name: 'One paid try-on', monthlyTryOns: 1 }),
  })

  const customer = await genvoris('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({ externalId: shopperId, planId: plan.id, resetPeriod: true, metadata: { model: 'PAY_PER_USE' } }),
  })

  const session = await genvoris(`/api/v1/customers/${customer.id}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ productId: checkout.metadata!.productId }),
  })

  res.json({ token: session.token })
})
```

## Recommended Genvoris plan tier

Growth. At 1,000 try-ons/month, a $0.99 shopper price can turn try-on from a cost center into recoverable revenue. Results depend on your traffic and conversion.

## Native platform support

- Shopify app: native after Shopify checkout setup.
- WordPress plugin: native through WooCommerce checkout.
- API: supported with Stripe, Shopify, WooCommerce, Paddle, or your own billing system.
