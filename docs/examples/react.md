---
sidebar_position: 4
title: React hook
description: Framework-agnostic useTryOn() hook for CRA / Vite / Remix / etc.
---

# React: `useTryOn()`

```tsx title="hooks/useTryOn.ts"
import { useCallback, useState } from 'react';

type OpenOpts = { productImages: string[] };

declare global {
  interface Window {
    Genvoris?: { openTryOn(o: OpenOpts & { token: string }): void };
  }
}

export function useTryOn(mintTokenUrl = '/api/genvoris/session') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const open = useCallback(async (opts: OpenOpts) => {
    if (!window.Genvoris) {
      setError(new Error('widget not loaded'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(mintTokenUrl, { method: 'POST', credentials: 'include' });
      if (!r.ok) throw new Error(`session mint failed: ${r.status}`);
      const { token } = (await r.json()) as { token: string };
      window.Genvoris.openTryOn({ ...opts, token });
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [mintTokenUrl]);

  return { open, loading, error };
}
```

Usage:

```tsx
import { useTryOn } from './hooks/useTryOn';

export function ProductPage({ image }: { image: string }) {
  const { open, loading, error } = useTryOn();
  return (
    <>
      <button disabled={loading} onClick={() => open({ productImages: [image] })}>
        {loading ? 'Loading…' : 'Try it on'}
      </button>
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}
```
