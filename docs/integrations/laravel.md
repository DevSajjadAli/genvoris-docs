---
sidebar_position: 4
title: Laravel
description: Official Laravel integration for Genvoris Virtual Try-On
---

# Laravel Integration

[![Latest Version on Packagist](https://img.shields.io/packagist/v/genvoris/laravel.svg)](https://packagist.org/packages/genvoris/laravel)
[![Tests](https://img.shields.io/github/actions/workflow/status/DevSajjadAli/laravel/tests.yml?label=tests)](https://github.com/DevSajjadAli/laravel/actions/workflows/tests.yml)
[![PHP Version](https://img.shields.io/packagist/php-v/genvoris/laravel.svg)](https://packagist.org/packages/genvoris/laravel)

The `genvoris/laravel` package is the official Laravel integration for the Genvoris Virtual Try-On platform. It provides a service provider, Facade, Blade directives, webhook handling, and a server-side proxy — covering everything you need to add virtual try-on to a Laravel application without exposing your API key to the browser.

**Requirements:** PHP ^8.1, Laravel ^10 | ^11 | ^12

> **Links:** [Packagist](https://packagist.org/packages/genvoris/laravel) · [GitHub](https://github.com/DevSajjadAli/laravel) · [Changelog](https://github.com/DevSajjadAli/laravel/blob/master/CHANGELOG.md)

---

## Installation

```bash
composer require genvoris/laravel
php artisan genvoris:install
```

Add your credentials to `.env`:

```dotenv
GENVORIS_API_KEY=gvk_live_your_key_here
GENVORIS_WEBHOOK_SECRET=your_webhook_secret_here
```

Confirm the connection:

```bash
php artisan genvoris:test-connection
```

---

## Configuration

Publish the config file:

```bash
php artisan vendor:publish --tag=genvoris-config
```

Key options in `config/genvoris.php`:

| Key | Default | Description |
|---|---|---|
| `api_key` | `env('GENVORIS_API_KEY')` | Platform API key |
| `api_base_url` | `https://genvoris.org/api/v1` | API base URL |
| `timeout` | `30` | HTTP timeout (seconds) |
| `retry.times` | `3` | Retries on 429 / 5xx |
| `webhook.secret` | `env('GENVORIS_WEBHOOK_SECRET')` | HMAC signing secret |
| `webhook.path` | `webhooks/genvoris` | Webhook route prefix |
| `proxy.path` | `genvoris-proxy` | Proxy route prefix |
| `external_id_prefix` | `laravel_` | Prefix for external IDs |
| `widget_url` | `https://api.genvoris.org/widget.js` | Widget script URL |

---

## Quick Start

### 1. Add the trait to your User model

```php
use Genvoris\Laravel\Concerns\HasGenvorisAccess;

class User extends Authenticatable
{
    use HasGenvorisAccess;
}
```

### 2. Mint a session token in a controller

```php
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TryOnController extends Controller
{
    public function session(Request $request): JsonResponse
    {
        $session = $request->user()->genvorisSession();
        return response()->json(['token' => $session->token]);
    }
}
```

### 3. Add the widget to your Blade layout

```blade
{{-- In your <head> or before </body> --}}
@genvorisConfig(['productId' => $product->id])
@genvorisScripts

{{-- Where you want the button --}}
@genvorisTryOnButton(['productId' => $product->id, 'label' => 'Try On'])
```

---

## API

### Facade

```php
use Genvoris\Laravel\Facades\Genvoris;

$customer = Genvoris::upsertCustomer('42', ['email' => 'alice@example.com']);
$session  = Genvoris::mintSession($customer->id);
$plans    = Genvoris::listPlans();
$usage    = Genvoris::customerUsage($customer->id);
```

### HasGenvorisAccess methods

| Method | Return type | Description |
|---|---|---|
| `genvorisExternalId()` | `string` | `laravel_{id}` |
| `syncToGenvoris(array $attrs)` | `Customer` | Upsert user in platform |
| `genvorisSession(int $expiresIn)` | `Session` | Mint a session token |
| `genvorisUsage()` | `CustomerUsage` | Fetch usage/quota |
| `canTryOn()` | `bool` | Whether user has quota |
| `genvorisCustomerId()` | `?string` | Cached portal customer ID |
| `genvorisPortalCustomer()` | `Customer` | Full portal customer object |

### Blade directives

| Directive | Output |
|---|---|
| `@genvorisScripts` | `<script src="..." defer>` widget loader |
| `@genvorisConfig($opts)` | `<script>window.genvorisConfig = {...};</script>` |
| `@genvorisWidget($opts)` | Config + scripts combined |
| `@genvorisTryOnButton($opts)` | `<button data-genvoris-product="...">` |

> **Security:** `@genvorisConfig` never includes `api_key` or `webhook.secret` in its output.

---

## Webhooks

Register your endpoint in the Genvoris dashboard:

```
POST https://yourapp.com/webhooks/genvoris
```

The package auto-registers this route. Signature verification is handled automatically by the `VerifyGenvorisWebhook` middleware.

### Listening to events

```php
use Genvoris\Laravel\Webhooks\Events\CustomerCreated;

Event::listen(CustomerCreated::class, function (CustomerCreated $event) {
    $data = $event->payload['data'];
    // provision local resources, send welcome email, etc.
});
```

All typed events expose a single `$payload` property (the full decoded JSON object).

#### Supported event types

| Portal event type | Laravel event class |
|---|---|
| `end_customer.created` | `CustomerCreated` |
| `end_customer.updated` | `CustomerUpdated` |
| `end_customer.cancelled` | `CustomerCancelled` |
| `end_customer.quota_warning` | `CustomerQuotaWarning` |
| `end_customer.quota_exhausted` | `CustomerQuotaExhausted` |
| `end_customer.period_rolled` | `CustomerPeriodRolled` |
| `plan.created` | `PlanCreated` |
| `plan.updated` | `PlanUpdated` |
| `plan.disabled` | `PlanDisabled` |

You can also listen to `GenvorisWebhookReceived` to catch all events in one listener.

---

## Proxy

The package registers `POST /genvoris-proxy/{path}` to forward widget requests to `api.genvoris.org` with your API key injected server-side. The browser never sees your key.

Default allowed paths: `api/analyze`, `api/tryon`, `api/config`, `api/status`.

`@genvorisConfig` automatically sets `window.genvorisConfig.apiProxyBase` to the proxy URL.

---

## Artisan Commands

| Command | Description |
|---|---|
| `php artisan genvoris:install` | Interactive setup wizard |
| `php artisan genvoris:test-connection` | Verify API key |
| `php artisan genvoris:list-plans` | Show plans table |
| `php artisan genvoris:list-customers` | Show customers table |
| `php artisan genvoris:webhook-test` | Send a signed test webhook |

---

## Optional: Customer Sessions Table

Publish and run the optional migration to cache customer IDs locally:

```bash
php artisan vendor:publish --tag=genvoris-migrations
php artisan migrate
```

This creates `genvoris_customer_sessions` with a polymorphic user relationship. When present, `HasGenvorisAccess` reads from it instead of calling the API on every request.

---

## Testing

```bash
composer test
```

The test suite uses `Http::fake()` — no live API calls are made.

---

## Further Reading

- [API Reference: Customers](../api/customers)
- [API Reference: Sessions](../api/sessions)
- [API Reference: Webhooks](../api/webhooks)
- [WordPress integration](./wordpress)
- [Shopify integration](./shopify)
