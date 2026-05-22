---
sidebar_position: 2
title: Express + Node SDK
description: Minimal Express server that mints sessions and verifies webhooks.
---

# Express + `@genvoris/node`

```bash
npm install express @genvoris/node
```

```ts title="server.ts"
import express from 'express';
import Genvoris, { WebhooksResource } from '@genvoris/node';

const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });
const app = express();

// 1. Session-mint endpoint — the browser calls this.
app.post('/api/genvoris/session', express.json(), async (req, res) => {
  // Replace this with your real auth middleware.
  const user = (req as any).user;
  if (!user) return res.status(401).end();

  let customer;
  try {
    customer = await gv.customers.retrieve(`u_${user.id}`);
  } catch {
    customer = await gv.customers.create({
      externalId: `u_${user.id}`,
      email: user.email,
      planId: process.env.GENVORIS_DEFAULT_PLAN_ID, // optional
    });
  }

  const session = await gv.sessions.mint({
    customerId: customer.id,
    ttlSeconds: 900,
  });
  res.json({ token: session.token, expires_at: session.expires_at });
});

// 2. Webhook receiver — Genvoris pushes events here.
app.post(
  '/webhooks/genvoris',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const event = WebhooksResource.verify({
        payload: req.body,
        header: req.header('genvoris-signature') ?? '',
        secret: process.env.GENVORIS_WEBHOOK_SECRET!,
      });
      switch (event.type) {
        case 'tryon.completed':
          // record usage in your DB
          break;
        case 'customer.quota_exceeded':
          // notify the customer
          break;
      }
      res.status(200).end();
    } catch {
      res.status(400).end(); // bad signature
    }
  }
);

app.listen(3000);
```

Browser side:

```html
<script src="https://cdn.genvoris.org/widget.js"
        data-api-key="gvk_live_xxx"
        defer></script>
<button id="tryon">Try it on</button>
<script>
  document.getElementById('tryon').addEventListener('click', async () => {
    const { token } = await fetch('/api/genvoris/session', { method: 'POST' }).then(r => r.json());
    window.Genvoris.openTryOn({ productImages: ['https://shop.example.com/dress.jpg'], token });
  });
</script>
```
