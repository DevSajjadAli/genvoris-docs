---
sidebar_position: 6
title: Vanilla JS
description: No build step. One script tag + a button.
---

# Vanilla JS

```html
<button id="tryon" data-image="https://shop.example.com/dress.jpg">Try it on</button>

<script src="https://api.genvoris.org/widget.js"
        data-api-key="gvk_pub_xxx"
        defer></script>
<script>
  document.querySelectorAll('[data-image]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const r = await fetch('/api/genvoris/session', { method: 'POST', credentials: 'include' });
      if (!r.ok) return alert('Please sign in first');
      const { token } = await r.json();
      window.Genvoris.openTryOn({
        productImages: [btn.dataset.image],
        token,
      });
    });
  });
</script>
```

Your `/api/genvoris/session` endpoint mints a token using the [Node SDK](./express) or any other server stack.
