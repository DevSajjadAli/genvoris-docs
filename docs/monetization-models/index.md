---
title: Monetization models
slug: /monetization-models
description: Five ways a store can offer virtual try-on to shoppers while Genvoris meters credits for the store.
---

# Monetization models

Genvoris is B2B infrastructure. Your store buys try-on credits from Genvoris. Your store then decides how shoppers access try-on.

You are always the merchant of record for your shoppers. Genvoris never touches shopper payment details, never creates shopper charges, and never decides your retail price. We only meter try-on usage and debit your store credit pool.

| Model | Shopper experience | Billing flow | Recommended guide |
| --- | --- | --- | --- |
| Free for all | Every shopper can try products with no login or payment gate. | Store pays Genvoris; shopper pays nothing for try-on. | [Free for all](/monetization-models/free-for-all) |
| Pay per try-on | Shopper pays for a single try-on session. | Store charges shopper; Genvoris debits store credits. | [Pay per try-on](/monetization-models/pay-per-tryon) |
| Freemium | Shopper gets a fixed free quota, then upgrades or pays. | Store funds free quota and charges for upgraded access. | [Freemium](/monetization-models/freemium) |
| Subscription | Shopper subscribes for monthly try-on access. | Store bills shopper monthly; Genvoris enforces quota. | [Subscription](/monetization-models/subscription) |
| Purchase unlock | Shopper earns try-on credits after buying products. | Store rewards buyers; Genvoris meters earned credits. | [Purchase unlock](/monetization-models/purchase-unlock) |

## Platform support summary

| Model | Shopify app | WordPress plugin | REST API |
| --- | --- | --- | --- |
| Free for all | Native setting | Native setting | Supported |
| Pay per try-on | Native after Shopify checkout setup | Native via WooCommerce checkout | Supported |
| Freemium | Native free quota; paid upgrade can use Shopify billing | Native quota; paid upgrade can use WooCommerce product/subscription | Supported |
| Subscription | Native when using Shopify subscription products; custom logic uses API | Requires WooCommerce Subscriptions; custom logic uses API | Supported |
| Purchase unlock | Native after order webhook access is approved | Native via WooCommerce order hooks | Supported |

## Implementation pattern

Every model follows the same API contract:

1. Create one or more Genvoris plans that represent shopper quotas.
2. Create or update a Genvoris end-customer using your shopper identifier.
3. Mint a short-lived session token server-side.
4. Pass the token to the widget.
5. Your store handles shopper payment, upgrade prompts, subscription state, or purchase rewards.

Start with the model-specific guide that matches your storefront UX.
