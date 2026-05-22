---
sidebar_position: 7
title: Shopify Liquid snippet
description: Drop-in for custom Shopify themes when not using the Genvoris app.
---

# Shopify Liquid snippet

If you installed the [Genvoris Shopify app](../integrations/shopify), this is done for you. Use the snippet below only when you maintain a fully custom theme.

```liquid title="snippets/genvoris-tryon.liquid"
{%- assign product_image = product.featured_image | image_url: width: 1200 -%}
<button
  type="button"
  class="genvoris-tryon-btn"
  data-image="{{ product_image }}"
  data-customer-id="{{ customer.id }}"
  {% unless customer %}disabled aria-disabled="true" title="Sign in to try on"{% endunless %}
>
  Try it on
</button>

<script src="https://cdn.genvoris.org/widget.js"
        data-api-key="{{ settings.genvoris_publishable_key }}"
        defer></script>

<script>
  document.querySelectorAll('.genvoris-tryon-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const r = await fetch('/apps/genvoris/session', { method: 'POST' });
      if (!r.ok) return;
      const { token } = await r.json();
      window.Genvoris.openTryOn({
        productImages: [btn.dataset.image],
        token,
      });
    });
  });
</script>
```

Include it in `sections/main-product.liquid`:

```liquid
{% render 'genvoris-tryon' %}
```

The `/apps/genvoris/session` route is provided by an embedded app proxy or your own Shopify Functions / cloudflare worker that calls the [`POST /api/v1/customers/{id}/sessions`](../api/sessions) endpoint with your store API key.
