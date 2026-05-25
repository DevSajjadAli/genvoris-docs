---
sidebar_position: 10
title: Auto-style sync
description: How the Genvoris widget detects your storefront's brand colors, fonts, and corners — and how to override them per embed.
---

# Auto-style sync

`widget.js` ships with a small `GenvorisStyleDetector` that samples your storefront on load and adapts the widget's modal, buttons, and accent colors to match. The goal is "looks native on most sites, no config required."

This guide documents:

1. What the detector samples
2. The override attributes you can put on the `<script>` tag
3. The precedence rules between detected, overridden, and fallback values

## How detection works

When the page loads, the detector inspects:

- The computed `color` and `background-color` of `<body>` and the most prominent header/CTA buttons it can find
- The dominant heading font (`getComputedStyle(h1 || h2).fontFamily`)
- Existing `border-radius` on buttons (used as the baseline corner radius)

Detected values are written to CSS custom properties on the widget's Shadow DOM host so the modal inherits them naturally:

| CSS variable | Used for |
| --- | --- |
| `--genvoris-primary` | Header strip, primary CTA background |
| `--genvoris-accent` | Selected swatch / focus ring |
| `--genvoris-background` | Modal surface |
| `--genvoris-text` | Body copy |
| `--genvoris-font` | Whole modal font stack |
| `--genvoris-radius` | Corner radius (px) |

## Override attributes

Any value set on the `<script>` tag wins over the detector. Omit an attribute to keep the detected value; set it to disable detection for that one property.

| Attribute | Type | Example | Effect |
| --- | --- | --- | --- |
| `data-auto-style` | `"false"` to disable | `data-auto-style="false"` | Skips the detector entirely; only your overrides + built-in fallbacks are used. |
| `data-primary-color` | CSS color | `data-primary-color="#0a1f44"` | Forces the primary color. |
| `data-accent-color` | CSS color | `data-accent-color="#c9a96a"` | Forces the accent color. |
| `data-background-color` | CSS color | `data-background-color="#ffffff"` | Forces the modal background. |
| `data-text-color` | CSS color | `data-text-color="#111111"` | Forces the body-copy color. |
| `data-font-family` | CSS font stack | `data-font-family="'Inter', sans-serif"` | Forces the modal font. |
| `data-border-radius` | bare integer (px) | `data-border-radius="8"` | Forces the corner radius. **Pass a number only** — the widget calls `parseInt` and ignores units. |

:::caution `data-border-radius` is a bare number
Use `data-border-radius="8"`, not `data-border-radius="8px"`. Trailing `px` is stripped, but other CSS length units (`rem`, `em`, `%`) will be silently parsed as `0`.
:::

## Example: keep detection, only pin the brand color

```html
<script
  src="https://api.genvoris.org/widget.js?key=gvk_live_xxxxxxxx"
  data-primary-color="#0a1f44"
></script>
```

The widget will still detect your font, accent, background, text color, and corner radius, but the primary color is locked to your hex.

## Example: opt out entirely

```html
<script
  src="https://api.genvoris.org/widget.js?key=gvk_live_xxxxxxxx"
  data-auto-style="false"
  data-primary-color="#0a1f44"
  data-accent-color="#c9a96a"
  data-border-radius="12"
></script>
```

Detection is skipped. Any attribute you omit falls back to the built-in default (a neutral light theme).

## Precedence

For every styleable property the order is:

```
explicit data-* attribute  >  detected value  >  built-in fallback
```

This is identical across all official integrations (Shopify app block, WordPress plugin, custom embeds via the dashboard's button designer) — they all just emit a `<script>` tag with the relevant `data-*` attributes you set in their UIs.

## Versioning

The widget exposes its version on two globals (the second is the canonical name; the first is kept as a backwards-compatible alias):

```js
window.Genvoris.version   // "1.0.0"
window.VTOWidget.version  // "1.0.0"
```

Use this to gate features in your own integrations when running against multiple widget builds.
