---
sidebar_position: 3
title: Next.js App Router
description: Server Action mints the session; client component opens the widget.
---

# Next.js (App Router)

```bash
npm install @genvoris/node
```

```ts title="app/actions/genvoris.ts"
'use server';
import Genvoris from '@genvoris/node';
import { auth } from '@/lib/auth'; // your own auth helper

const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });

export async function mintTryOnToken() {
  const { userId, email } = await auth();
  if (!userId) throw new Error('unauthenticated');

  let customer;
  try {
    customer = await gv.customers.retrieve(`u_${userId}`);
  } catch {
    customer = await gv.customers.create({ externalId: `u_${userId}`, email });
  }
  const session = await gv.sessions.mint({ customerId: customer.id, ttlSeconds: 900 });
  return session.token;
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
          src="https://cdn.genvoris.org/widget.js"
          data-api-key={process.env.NEXT_PUBLIC_GENVORIS_API_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

:::warning
`NEXT_PUBLIC_GENVORIS_API_KEY` is the **publishable** key (`gvk_pub_…`), not your live secret. Live keys must never reach the browser.
:::
