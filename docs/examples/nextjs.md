---
sidebar_position: 3
title: Next.js App Router
description: Server Action mints the session; client component opens the widget.
---

# Next.js (App Router)

This example uses Node's built-in `fetch` — no Genvoris SDK package required.

```ts title="app/actions/genvoris.ts"
'use server';
import { auth } from '@/lib/auth'; // your own auth helper

const BASE = 'https://genvoris.org/api/v1';

async function gvPost(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GENVORIS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    // Next.js: opt out of the Data Cache for this call
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Genvoris ${res.status}`);
  return res.json();
}

export async function mintTryOnToken() {
  const { userId, email } = await auth();
  if (!userId) throw new Error('unauthenticated');

  // POST /customers is an upsert — safe to call on every page load.
  const customer = await gvPost('/customers', {
    externalId: `u_${userId}`,
    email,
  });
  const session = await gvPost(`/customers/${customer.id}/sessions`);
  return session.token as string;
}
```

```tsx title="app/(shop)/components/TryOnButton.tsx"
'use client';
import { useState } from 'react';
import { mintTryOnToken } from '@/app/actions/genvoris';

declare global {
  interface Window {
    Genvoris?: { openTryOn(o: { productImages: string[]; token: string }): void };
  }
}

export function TryOnButton({ image }: { image: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const token = await mintTryOnToken();
          window.Genvoris?.openTryOn({ productImages: [image], token });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Loading…' : 'Try it on'}
    </button>
  );
}
```

Load the widget once in your root layout:

```tsx title="app/layout.tsx"
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://api.genvoris.org/widget.js?no_fab=1"
          data-api-url="/api/genvoris/proxy/"
          data-events-url="/api/genvoris/proxy/api/v1/events"
          data-platform="custom"
          data-no-fab="true"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

:::warning
Do not create `NEXT_PUBLIC_GENVORIS_API_KEY` for live merchant keys. `NEXT_PUBLIC_*` values are bundled into browser JavaScript. Keep `GENVORIS_API_KEY` in server actions/API routes only, and expose only same-origin proxy/session URLs to the widget.
:::
