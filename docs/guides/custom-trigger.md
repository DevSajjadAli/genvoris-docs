---
sidebar_position: 9
title: Custom trigger
description: Open the Genvoris widget from your own button, link, or framework code.
---

# Custom trigger

The drop-in `widget.js` script publishes a small global API (`window.Genvoris`) so you can build your own button, your own React component, or open the modal in response to an event (URL hash, modal close, framework router transition, etc).

## Quick start

```html
<script
  src="https://api.genvoris.org/widget.js"
  defer
  data-api-key="gvk_live_xxxxxxxx"
></script>

<button id="my-try-on">Try this on me</button>

<script>
  document.getElementById('my-try-on').addEventListener('click', function () {
    window.Genvoris.openTryOn({
      productImages: ['/img/dress-front.jpg', '/img/dress-back.jpg'],
      productTitle: 'Black Wrap Dress',
      productCategory: 'apparel',
      page_url: window.location.href,
    });
  });
</script>
```

## Declarative variant

Add `data-genvoris-trigger` to any element. The widget scans on load **and** watches for late-mounted DOM via `MutationObserver`, so you don't have to call any init function after SPA route changes or after AJAX-rendered card grids appear.

```html
<button
  data-genvoris-trigger
  data-product-image="/img/dress.jpg"
  data-product-title="Black Wrap Dress"
  data-product-category="apparel"
>
  Try it on
</button>
```

## React

```tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Genvoris?: { openTryOn: (opts: Record<string, unknown>) => void };
  }
}

export function TryOnButton({ product }: { product: { images: string[]; title: string } }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={() =>
        window.Genvoris?.openTryOn({
          productImages: product.images,
          productTitle: product.title,
          productCategory: 'apparel',
        })
      }
    >
      Try {product.title}
    </button>
  );
}
```

## When the script hasn't loaded yet

`widget.js` is loaded with `defer`, so on a cold page load `window.Genvoris` may not exist for a few hundred milliseconds. If you intend to trigger from a `useEffect` or similar, guard with a short poll:

```js
function waitForGenvoris(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    (function tick() {
      if (window.Genvoris) return resolve(window.Genvoris);
      if (Date.now() - started > timeoutMs) return reject(new Error('genvoris_timeout'));
      setTimeout(tick, 100);
    })();
  });
}
```

## Field reference

Every field on the `openTryOn(options)` argument is optional; missing values fall back to the loader script's `data-*` attributes.

| Field | Type | Notes |
| --- | --- | --- |
| `productImages` | `string[]` | Multiple reference shots improve quality for `apparel` and `object`. |
| `productTitle` | `string` | Shown in the result card. |
| `productCategory` | `'apparel' \| 'home' \| 'object' \| 'other'` | Routes the request to the appropriate try-on model on our side. |
| `page_url` | `string` | Used for analytics + the `tryon.completed` webhook payload. |
| `token` | `string` | Optional end-customer session JWT. Overrides `data-end-customer-token`. |
