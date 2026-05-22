---
sidebar_position: 8
title: Button design
description: Programmatic and dashboard control over how the Genvoris widget button looks.
---

# Button design

The Button Designer in the Genvoris portal (`Integration → Button Designer`) lets you tune the appearance of the Genvoris widget trigger without redeploying your storefront. Settings are stored per-merchant and served from a public endpoint so the widget can pick them up on every page load.

## Endpoints

### `GET /api/integrations/button-design`

Authenticated. Returns the current merchant's saved design, or sensible defaults.

```bash
curl https://api.genvoris.org/api/integrations/button-design \
  -H "Authorization: Bearer <session>"
```

```json
{
  "data": {
    "label": "Try On",
    "borderRadius": 8,
    "fontSize": 14,
    "paddingX": 20,
    "paddingY": 10,
    "icon": "sparkles",
    "position": "inline",
    "showOnCards": false
  }
}
```

### `POST /api/integrations/button-design`

Authenticated. Upserts the design. All fields validated server-side.

```bash
curl -X POST https://api.genvoris.org/api/integrations/button-design \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session>" \
  -d '{ "label": "Virtual Try-On", "icon": "camera", "borderRadius": 12 }'
```

### `GET /api/widget/button-design?key=<api-key>`

**Public.** No authentication; the API key is read either from `?key=` or the `X-API-Key` header. Returns the same shape as the authenticated GET. CORS open, cached 60 s. Falls back to defaults — never returns an error to the browser — so a missing/rotated key cannot break the storefront.

## Field reference

| Field | Type | Range / values | Default |
| --- | --- | --- | --- |
| `label` | string | 1–20 chars | `"Try On"` |
| `borderRadius` | integer (px) | 0–40 | `8` |
| `fontSize` | integer (px) | 10–24 | `14` |
| `paddingX` | integer (px) | 4–60 | `20` |
| `paddingY` | integer (px) | 4–40 | `10` |
| `icon` | enum | `none` `camera` `sparkles` `shirt` `eye` `wand` | `sparkles` |
| `position` | enum | `inline` `floating-right` `floating-left` | `inline` |
| `showOnCards` | boolean | — | `false` |

`showOnCards` enables a compact icon button on every WooCommerce collection card and on Shopify collection / search / index sections. See the integration guides for the per-platform rendering details.
