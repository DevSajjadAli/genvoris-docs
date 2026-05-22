---
sidebar_position: 1
title: Examples overview
description: Copy-paste recipes for the most common integration stacks.
---

# Examples

Drop-in recipes for popular stacks. Each one mints a session on the server and hands the token to the widget on the browser — never ship your `gvk_live_…` key to the client.

| Stack | What it shows |
| --- | --- |
| [Express](./express) | Minimal REST proxy that mints sessions on demand. |
| [Next.js App Router](./nextjs) | Server Action that returns a session token to a React Server Component. |
| [React (any framework)](./react) | `useTryOn()` hook + headless button. |
| [Vue 3](./vue) | `useTryOn` composable for Vue/Nuxt. |
| [Vanilla JS](./vanilla) | No build step. One `<script>` tag + a button. |
| [Shopify Liquid snippet](./shopify-liquid) | Drop-in for custom Shopify themes (non-app install). |
| [WooCommerce shortcode](./woocommerce) | `[genvoris_tryon]` shortcode for WordPress sites. |

All examples assume:

- `GENVORIS_API_KEY` is set on your server.
- You have at least one [plan](../api/plans) and one verified domain.
- The end-customer is identified by some `externalId` (your auth system's user id).
