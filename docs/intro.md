---
slug: /
sidebar_position: 1
title: Introduction
description: Genvoris is the virtual try-on infrastructure that lets your e-commerce store sell VTON access as its own metered subscription.
---

# Genvoris — VTON Infrastructure for E-commerce

Genvoris is **virtual try-on infrastructure** designed for stores that want to **monetise** the feature, not just absorb its cost.

You buy try-on credits from us. Then you create plans, sell them on your own website using your own billing system, and your end-customers consume try-ons against those plans. We meter every try-on, enforce per-customer quotas, and never touch your customers' money.

## Why this exists

Virtual try-on is high-conversion but **expensive at scale**. A store with 5 M monthly visitors offering free try-on can burn through tens of thousands of dollars while only a fraction of users convert. Most existing VTON platforms only sell *to* the store — they leave the abuse problem unsolved.

Genvoris flips the model:

- **You** stay the merchant of record for your customers.
- **Your billing system** (Stripe, Shopify, WooCommerce, anything) charges them.
- **Genvoris** enforces the quota, tracks usage, and bills you only for what was actually consumed.

```
End-customer pays Adidas (Stripe)         ← Adidas's billing
       ↓
Adidas backend → Genvoris (mint session)  ← server-to-server, store API key
       ↓
End-customer browser → Widget → Genvoris  ← short-lived JWT
       ↓
Genvoris debits Adidas pool + meters customer
```

## Two layers

| Layer | Pays | Counterparty |
| --- | --- | --- |
| **L1** — Credit pack | Store → Genvoris | One-time pack purchase, FIFO consumption, 1-year validity |
| **L2** — End-customer plan | End-customer → Store | Monthly try-on quota enforced by us, money handled by store |

## Get started in five minutes

1. **[Quickstart →](./quickstart)** — create a plan, register a customer, mint a session, run a try-on.
2. **[Concepts →](./concepts)** — credit packs, plans, customers, sessions, quotas.
3. **[API reference →](./api/authentication)** — every endpoint, every error code.
4. **[Embed the widget →](./api/widget)** — drop one script tag on your product page.

## Drop-in integrations

| Integration | Status | Docs |
| --- | --- | --- |
| Shopify (native app) | **Live** in App Store review | [Shopify integration →](./integrations/shopify) |
| WooCommerce | Planned | — |
| Magento | Planned | — |
| Anything else (custom REST) | Always available | [Custom integration →](./integrations/custom) |

The universal REST flow under [API reference](./api/authentication) works on every stack — the drop-in integrations above are just convenience wrappers around the same endpoints.
