---
sidebar_position: 4
title: Laravel
description: Official Laravel integration for Genvoris Virtual Try-On — service provider, Facade, Blade directives, webhooks, server-side proxy, Artisan commands
---

# Laravel Integration

[![Latest Version on Packagist](https://img.shields.io/packagist/v/genvoris/laravel.svg)](https://packagist.org/packages/genvoris/laravel)
[![Tests](https://img.shields.io/github/actions/workflow/status/DevSajjadAli/laravel/tests.yml?label=tests)](https://github.com/DevSajjadAli/laravel/actions/workflows/tests.yml)
[![PHP Version](https://img.shields.io/packagist/php-v/genvoris/laravel.svg)](https://packagist.org/packages/genvoris/laravel)

The `genvoris/laravel` package is the official Laravel integration for the Genvoris Virtual Try-On platform. It provides a service provider, Facade, Blade directives, webhook verification and dispatch, and a server-side proxy — everything you need to add virtual try-on to a Laravel application without exposing your API key to the browser.

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
| `retry.times` | `3` | Retries on 429 / 5xx (200/800/3200ms jittered backoff) |
| `retry.sleep` | `[200, 800, 3200]` | Sleep intervals in ms |
| `webhook.secret` | `env('GENVORIS_WEBHOOK_SECRET')` | HMAC signing secret |
| `webhook.path` | `webhooks/genvoris` | Webhook route prefix |
| `webhook.middleware` | `['api']` | Middleware groups for the webhook route |
| `webhook.listeners` | `[]` | Additional event-to-listener bindings |
| `proxy.path` | `genvoris-proxy` | Proxy route prefix |
| `proxy.middleware` | `['throttle:60,1']` | Middleware for proxy routes |
| `proxy.allowed_paths` | `['api/analyze', 'api/tryon', 'api/config', 'api/status']` | Allowed upstream paths |
| `proxy.enforce_origin` | `false` | When true, checks `Origin` against `APP_URL` |
| `external_id_prefix` | `laravel_` | Prefix for external IDs |
| `widget_url` | `https://api.genvoris.org/widget.js` | Widget script URL |
| `cache.sessions` | `true` | Cache minted session tokens |
| `cache.store` | `null` | Cache store (null = default) |
| `cache.ttl` | `840` | Session cache TTL in seconds |

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

The trait auto-prefixes your user IDs with the configured `external_id_prefix` (default `laravel_`). It also exposes methods for syncing, session minting, and quota checks (see [HasGenvorisAccess methods](#hasgenvorisaccess-methods) below).

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

### Resource methods

Access the underlying resource classes directly for fine-grained control:

```php
use Genvoris\Laravel\Facades\Genvoris;

// Customers
Genvoris::customer()->upsert('42', ['email' => 'alice@example.com']);
Genvoris::customer()->find('ec_abc');
Genvoris::customer()->findByExternalId('laravel_42');
Genvoris::customer()->list(['status' => 'ACTIVE']);
Genvoris::customer()->update('ec_abc', ['email' => 'new@example.com']);
Genvoris::customer()->cancel('ec_abc');       // soft cancel
Genvoris::customer()->usage('ec_abc');        // returns CustomerUsage

// Plans
Genvoris::plan()->create(['name' => 'Pro', 'monthlyTryOns' => 100]);
Genvoris::plan()->find('pln_abc');
Genvoris::plan()->list();
Genvoris::plan()->update('pln_abc', ['name' => 'Pro Plus']);
Genvoris::plan()->disable('pln_abc');         // soft-disable

// Sessions
Genvoris::session()->mint('ec_abc', ['ttlSeconds' => 900]);
Genvoris::session()->mintForUser($user);      // upserts + mints in one call

// Webhook verifier (stateless)
Genvoris::webhooks()->verify($rawBody, $signatureHeader, $secret);
```

### HasGenvorisAccess methods

When you add the `HasGenvorisAccess` trait to an Eloquent model:

| Method | Return type | Description |
|---|---|---|
| `genvorisExternalId()` | `string` | Returns `{prefix}_{id}` (e.g. `laravel_42`) |
| `syncToGenvoris(array $attrs)` | `Customer` | Upserts the user in the Genvoris platform and caches the customer ID locally |
| `genvorisCustomerId()` | `?string` | Reads the cached Genvoris customer ID from the local sessions table (if migration was run), or calls the API |
| `genvorisSession(int $expiresIn)` | `Session` | Mints a session token (optionally cached) |
| `genvorisUsage()` | `CustomerUsage` | Fetches current usage and quota |
| `canTryOn()` | `bool` | Whether the user has remaining quota (returns false on any error) |
| `genvorisPortalCustomer()` | `Customer` | Fetches the full Genvoris customer object |
| `resolveOrSyncCustomerId()` | `string` | (internal) Resolves the customer ID, syncing if not found |

### Blade directives

| Directive | Output |
|---|---|
| `@genvorisScripts` | `<script src="..." defer>` — loads the widget |
| `@genvorisConfig($opts)` | `<script>window.genvorisConfig = {...};</script>` — config JSON |
| `@genvorisWidget($opts)` | Config + scripts combined in one directive |
| `@genvorisTryOnButton($opts)` | `<button data-genvoris-product="...">Try On</button>` |

> **Security:** `@genvorisConfig` never includes `api_key` or `webhook.secret` in its output. JSON is encoded with `JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP` to prevent XSS.

### Components

| Component | Usage |
|---|---|
| `<x-genvoris-try-on-button />` | `$productId`, `$class` (default: `genvoris-try-on-btn`), `$label` (default: `Try On`) |
| `<x-genvoris-try-on-script />` | Emits the deferred widget script tag (no config) |

---

## Webhooks

The package auto-registers a webhook route and verifies every payload with HMAC-SHA256 before it reaches your event listeners. Register your endpoint in the Genvoris dashboard:

```
POST https://yourapp.com/webhooks/genvoris
```

### Verification

Verification is handled automatically by the `VerifyGenvorisWebhook` middleware. It:

1. Reads the raw body via `$request->getContent()`.
2. Parses the `X-Genvoris-Signature` header (`t=<unix>,v1=<hex>`).
3. Validates the timestamp is within ±300 seconds (replay protection).
4. Computes `HMAC-SHA256` of `${t}.${rawBody}` and compares with `hash_equals()` (constant-time).
5. Aborts with `401` on failure.

The underlying `WebhookVerifier` class is also available for manual use:

```php
use Genvoris\Laravel\Webhooks\WebhookVerifier;

$verifier = new WebhookVerifier();
$valid = $verifier->verify($rawBody, $signatureHeader, $secret);
// returns bool — never throws
```

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

| Portal event type | Laravel event class | Fires when |
|---|---|---|
| `end_customer.created` | `CustomerCreated` | First upsert of a customer |
| `end_customer.updated` | `CustomerUpdated` | Customer re-upserted or PATCH'd |
| `end_customer.cancelled` | `CustomerCancelled` | Customer DELETEd (soft cancel) |
| `end_customer.quota_warning` | `CustomerQuotaWarning` | Customer crosses 80% of plan quota |
| `end_customer.quota_exhausted` | `CustomerQuotaExhausted` | Try-on rejected for quota |
| `end_customer.period_rolled` | `CustomerPeriodRolled` | Period auto-rolled to new 30-day window |
| `plan.created` | `PlanCreated` | A plan was created |
| `plan.updated` | `PlanUpdated` | A plan was updated |
| `plan.disabled` | `PlanDisabled` | A plan was soft-deleted |

You can also listen to `GenvorisWebhookReceived` to catch all events in a single listener:

```php
use Genvoris\Laravel\Webhooks\Events\GenvorisWebhookReceived;

Event::listen(GenvorisWebhookReceived::class, function (GenvorisWebhookReceived $event) {
    // $event->type — the raw event type string
    // $event->id   — the event envelope id
    // $event->payload — full decoded JSON
});
```

### Idempotency

The `WebhookController` deduplicates deliveries using the `X-Genvoris-Delivery` header. Duplicates within 24 hours return `{"received": true, "duplicate": true}` and are not dispatched to listeners.

### Webhook test command

Send a synthetic signed webhook to test your endpoint:

```bash
php artisan genvoris:webhook-test
```

Optional: `--url` to override the destination, `--event` to change the event type (default: `end_customer.created`).

---

## Proxy

The package registers `POST /genvoris-proxy/{path}` to forward widget requests to the Genvoris API with your API key injected server-side — the browser never sees your key.

### Security features

- **Path allowlist** — only paths in `proxy.allowed_paths` are forwarded (default: `api/analyze`, `api/tryon`, `api/config`, `api/status`).
- **Path traversal guard** — rejects paths containing `..` or null bytes.
- **HTTP method whitelist** — only `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` are allowed; other methods return 405.
- **Origin enforcement** — when `proxy.enforce_origin` is true, the `Origin`/`Referer` header is checked against `APP_URL` (case-insensitive).
- **Rate limiting** — configurable via `proxy.middleware` (default: 60 requests/min per IP).
- **Key isolation** — the `X-API-Key` header is added server-side; it is stripped from the response body.
- **Connection failure handling** — upstream 5xx or connection errors return 502 without exposing internal details.

`@genvorisConfig` automatically sets `window.genvorisConfig.apiProxyBase` to the proxy URL.

---

## Artisan Commands

| Command | Description |
|---|---|
| `php artisan genvoris:install` | Interactive setup — publishes config, optionally views and migration |
| `php artisan genvoris:test-connection` | Verify API key connectivity (lists plans on success) |
| `php artisan genvoris:list-plans` | Display all plans in a table (ID, Name, Status, Monthly Try-Ons) |
| `php artisan genvoris:list-customers` | Display paginated customer list (ID, External ID, Email, Status, Plan ID) |
| `php artisan genvoris:webhook-test` | Send a signed synthetic webhook to test your handler |

---

## Optional: Customer Sessions Table

Publish and run the optional migration to cache customer IDs locally:

```bash
php artisan vendor:publish --tag=genvoris-migrations
php artisan migrate
```

This creates a `genvoris_customer_sessions` table with a polymorphic user relationship:

| Column | Type | Purpose |
|---|---|---|
| `user_type` | string | Morphs to your User model |
| `user_id` | bigint | Local user primary key |
| `genvoris_customer_id` | string | The `ec_xxx` id from Genvoris |
| `external_id` | string | `laravel_{local_user_id}` |
| `plan_id` | string | Current plan snapshot |
| `status` | string | Current customer status |
| `session_token` | text | Cached JWT |
| `session_expires_at` | datetime | Token expiry |
| `last_synced_at` | datetime | Last sync timestamp |

When present, `HasGenvorisAccess` reads from it instead of calling the API on every request.

---

## Error handling

All Genvoris exceptions extend `GenvorisException` (which extends `RuntimeException`):

| Exception | HTTP | Thrown when |
|---|---|---|
| `AuthException` | 401 / 403 | Invalid or revoked API key |
| `ApiException` | 4xx / 5xx | API returned an error (has `statusCode`, `errorCode`, `requestId`) |
| `WebhookException` | — | Webhook signature verification failed |
| `GenvorisException` | — | Network errors (DNS failure, connection refused, timeout) |

The SDK never exposes the API key in exception messages.

## Testing

```bash
composer test
```

The test suite uses `Http::fake()` — no live API calls are made. The package ships 40+ tests across unit and feature suites:

- **ClientTest** — auth headers, response unwrapping, error mapping
- **DataObjectsTest** — DTO construction from API responses
- **WebhookVerificationTest** — valid signatures, tampered bodies, expired timestamps
- **BladeDirectivesTest** — script output, XSS escaping, config isolation
- **CustomerResourceTest** — upsert, prefix handling, find
- **SessionResourceTest** — mint, TTL clamping
- **ProxyControllerTest** — key injection, path allowlist, method whitelist, 502 handling
- **WebhookControllerTest** — event dispatch, duplicate detection, signature enforcement
- **ServiceProviderTest** — facade resolution, config loading

---

## Further Reading

- [API Reference: Customers](../api/customers)
- [API Reference: Sessions](../api/sessions)
- [API Reference: Webhooks](../api/webhooks)
- [API Reference: Errors](../api/errors)
- [Node SDK reference](../api/sdk-node)
- [Custom REST integration](./custom)
- [WordPress integration](./wordpress)
- [Shopify integration](./shopify)
