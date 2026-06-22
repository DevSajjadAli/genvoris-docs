---
sidebar_position: 2
title: Express (REST)
description: Minimal Express server that mints sessions and verifies webhooks using the REST API.
---

# Express

This example uses Node's built-in `fetch` — no Genvoris SDK package required.

```bash
npm install express
```

```ts title="server.ts"
import express from 'express';
import crypto from 'crypto';

const BASE = 'https://genvoris.org/api/v1';

async function gv(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GENVORIS_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`Genvoris ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

const app = express();

// 1. Session-mint endpoint — the browser calls this.
app.post('/api/genvoris/session', express.json(), async (req, res) => {
  // Replace this with your real auth middleware.
  const user = (req as any).user;
  if (!user) return res.status(401).end();

  // POST /customers is an upsert — safe to call on every page load.
  const customer = await gv('/customers', {
    method: 'POST',
    body: JSON.stringify({
      externalId: `u_${user.id}`,
      email: user.email,
      planId: process.env.GENVORIS_DEFAULT_PLAN_ID, // optional
    }),
  });

  const session = await gv(`/customers/${customer.id}/sessions`, { method: 'POST' });
  res.json({ token: session.token, expires_at: session.expires_at });
});

// 2. Webhook receiver — Genvoris pushes events here.
app.post(
  '/webhooks/genvoris',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const header = req.header('genvoris-signature') ?? '';
    const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
    const { t, v1 } = parts;
    if (!t || !v1) return res.status(400).end();

    // Verify HMAC-SHA256 signature
    const expected = crypto
      .createHmac('sha256', process.env.GENVORIS_WEBHOOK_SECRET!)
      .update(`${t}.${req.body}`)
      .digest('hex');
    const sigOk = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
    const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300; // 5-minute window
    if (!sigOk || !fresh) return res.status(400).end();

    const event = JSON.parse(req.body.toString());
    switch (event.type) {
      case 'tryon.completed':
        // record usage in your DB
        break;
      case 'customer.quota_exhausted':
        // notify the customer
        break;
    }
    res.status(200).end();
  }
);

app.listen(3000);
```

Browser side:

```html
<script
  src="https://api.genvoris.org/widget.js?no_fab=1"
  data-api-url="/api/genvoris/proxy/"
  data-events-url="/api/genvoris/proxy/api/v1/events"
  data-platform="custom"
  data-no-fab="true"
  defer
></script>
<button id="tryon">Try it on</button>
<script>
  document.getElementById('tryon').addEventListener('click', async () => {
    const { token } = await fetch('/api/genvoris/session', { method: 'POST' }).then(r => r.json());
    window.Genvoris.openTryOn({ productImages: ['https://shop.example.com/dress.jpg'], token });
  });
</script>
```

Keep `GENVORIS_API_KEY` in the Express process environment only. The `/api/genvoris/proxy/*` route should enforce a strict allowlist and inject that key server-side for widget try-on/event requests.

See [Webhook events](../api/webhooks) for the full signature spec and event catalogue.
