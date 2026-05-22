# `@genvoris/node`

Official Node.js SDK for the [Genvoris](https://genvoris.org) Virtual Try-On API.

```bash
npm install @genvoris/node
```

Node.js >= 18 is required (the SDK uses the built-in `fetch`).

## Usage

```ts
import Genvoris from '@genvoris/node';

const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });

const customer = await gv.customers.create({
  externalId: 'shop_user_42',
  email: 'jane@example.com',
});

const session = await gv.sessions.mint({
  customerId: customer.id,
  ttlSeconds: 3600,
});

// Hand `session.token` to the widget on the storefront:
//   <script src="https://api.genvoris.org/widget.js"
//           data-api-key="gvk_live_xxx"
//           data-end-customer-token="<server-rendered>"></script>
```

## Configuration

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | (required) | Starts with `gvk_live_` or `gvk_test_`. |
| `baseUrl` | `https://api.genvoris.org` | Override for self-hosting / staging. |
| `timeoutMs` | `30_000` | Per-request timeout via `AbortController`. |
| `maxRetries` | `3` | Retries on 429 / 5xx with exponential backoff + jitter. |
| `fetch` | `globalThis.fetch` | Provide your own (e.g. `undici`) if needed. |
| `defaultHeaders` | `{}` | Attached to every request. |

## Errors

```ts
import { GenvorisAPIError, GenvorisAuthError } from '@genvoris/node';

try {
  await gv.customers.retrieve('cus_missing');
} catch (err) {
  if (err instanceof GenvorisAuthError) {
    // 401 / 403 -- bad key or revoked
  } else if (err instanceof GenvorisAPIError) {
    console.error(err.status, err.code, err.requestId);
  }
}
```

## Webhooks

```ts
import express from 'express';
import { WebhooksResource } from '@genvoris/node';

const app = express();

// IMPORTANT: use raw-body parser so the signature can be verified against the
// exact bytes Genvoris sent. JSON.parse-and-re-stringify will break the HMAC.
app.post(
  '/webhooks/genvoris',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const event = WebhooksResource.verify({
        payload: req.body, // Buffer
        header: req.headers['genvoris-signature'] as string,
        secret: process.env.GENVORIS_WEBHOOK_SECRET!,
      });
      console.log('Got event:', event.type, event.id);
      res.status(200).end();
    } catch (err) {
      console.warn('Signature rejected:', err);
      res.status(400).end();
    }
  },
);
```

## MERN example: minting sessions

```ts
// server/routes/genvoris.ts
import { Router } from 'express';
import Genvoris from '@genvoris/node';

const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });
const router = Router();

router.post('/genvoris/session', async (req, res) => {
  // Trust your own auth layer here -- this route MUST require a logged-in user.
  const userId = req.session?.userId;
  if (!userId) return res.status(401).end();

  let customer;
  try {
    customer = await gv.customers.retrieve(`u_${userId}`);
  } catch {
    customer = await gv.customers.create({
      externalId: `u_${userId}`,
      email: req.session?.email,
    });
  }

  const session = await gv.sessions.mint({ customerId: customer.id, ttlSeconds: 3600 });
  res.json({ token: session.token });
});

export default router;
```

```tsx
// client/components/TryOnButton.tsx
import { useEffect, useState } from 'react';

export function TryOnButton({ product }: { product: { id: string; image: string } }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/genvoris/session', { method: 'POST' })
      .then((r) => r.json())
      .then((j) => setToken(j.token));
  }, []);
  if (!token) return null;
  return (
    <button
      onClick={() =>
        (window as { Genvoris?: { openTryOn: (o: unknown) => void } }).Genvoris?.openTryOn({
          productImages: [product.image],
          token,
        })
      }
    >
      Try it on
    </button>
  );
}
```

## WooCommerce-proxy example

Use the SDK as a tiny Express proxy in front of WooCommerce so the storefront
never has to hold the live Genvoris API key.

```ts
import express from 'express';
import Genvoris from '@genvoris/node';

const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });
const app = express();
app.use(express.json());

app.post('/proxy/genvoris/session', async (req, res) => {
  // Authenticate the request against your WooCommerce session cookie here.
  const externalId = req.body.externalId as string;
  let customer;
  try {
    customer = await gv.customers.retrieve(externalId);
  } catch {
    customer = await gv.customers.create({ externalId, email: req.body.email });
  }
  const session = await gv.sessions.mint({ customerId: customer.id });
  res.json(session);
});

app.listen(3001);
```

## License

MIT © Genvoris
