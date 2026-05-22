---
sidebar_position: 1
title: Custom integration
description: End-to-end integration recipe for any stack with example Node code.
---

# Custom integration

If you're not on Shopify / WooCommerce yet, this is the recipe.

## 1. Listen for subscription events in your billing system

Hook your own billing webhooks (Stripe, Chargebee, anything) for `subscription.created` and `subscription.renewed`. On either event, upsert a Genvoris customer:

```ts
import fetch from 'node-fetch'

async function syncCustomer(stripeSub: any) {
  const planMap = {
    price_basic: 'pln_basic_id',
    price_pro:   'pln_pro_id',
  }
  await fetch('https://genvoris.org/api/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GENVORIS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalId: stripeSub.customer,                      // Stripe cust id
      email: stripeSub.customer_email,
      planId: planMap[stripeSub.items.data[0].price.id],
      metadata: { stripe_subscription_id: stripeSub.id },
    }),
  })
}
```

## 2. Cancel / pause appropriately

```ts
// On subscription.deleted
await fetch(`https://genvoris.org/api/v1/customers/${ourCustomerId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${process.env.GENVORIS_API_KEY}` },
})

// On subscription.paused
await fetch(`https://genvoris.org/api/v1/customers/${ourCustomerId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${process.env.GENVORIS_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ status: 'PAUSED' }),
})
```

## 3. Mint a session on each product page render

Server-side render a session token for the logged-in customer:

```ts
// Express handler for /product/:slug
app.get('/product/:slug', async (req, res) => {
  const customerId = await db.getGenvorisCustomerId(req.user.id)
  const r = await fetch(`https://genvoris.org/api/v1/customers/${customerId}/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GENVORIS_API_KEY}` },
  })
  const { token } = await r.json()
  res.render('product', { tryonToken: token })
})
```

## 4. Drop the widget into the template

```html
<script
  src="https://cdn.genvoris.org/widget.js"
  defer
  data-api-key="<%= process.env.GENVORIS_PUBLIC_KEY %>"
  data-end-customer-token="<%= tryonToken %>"
></script>
```

## 5. Handle the `end_customer_quota` paywall

The widget emits a `genvoris:quota` DOM event when the user hits 402. Listen for it and show your own upgrade modal:

```js
window.addEventListener('genvoris:quota', (e) => {
  const { reason, used, limit } = e.detail
  showUpgradeModal({ reason, used, limit })
})
```

That's the entire integration.
