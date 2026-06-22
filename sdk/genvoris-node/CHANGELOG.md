# Changelog

All notable changes to `@genvoris/node` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-23

### Added
- First-class widget analytics event ingestion via `gv.events.track()` and `gv.events.trackBatch()`.
- Conversion attribution resource via `gv.conversions.create()`.
- Return/refund analytics resource via `gv.returns.create()`.
- Type exports for widget event, conversion, and return payloads.

### Changed
- Documentation now reinforces server-only live API key usage for hosted-widget integrations.
- SDK user agent version updated for the relaunch package.

## [1.0.1] - 2026-06-16

### Fixed
- Error-code/message fallback when the API returns empty-string fields (now uses
  `||` instead of `??` so empty strings fall through to defaults).
- Hex character validation in `hexToBytes()` — rejects non-hex characters before
  conversion.
- Webhook test payload field `event` → `type` to match actual API contract.
- Removed fragile custom crypto shims; added `@types/node` dev dependency.

### Changed
- Retry backoff pinned to **decorated jitter**: `250ms × 2^attempt × (0.7 + random() × 0.6)`
  — a ±30% spread around the exponential target, avoiding the thundering-herd
  spike of full jitter.
- Fresh `AbortController` created per retry attempt so a slow first request
  cannot poison a later retry with an already-fired signal.
- Added `Accept: application/json` to default request headers.
- `tsconfig.json` now uses `"types": ["node"]` for proper Node type resolution.

## [1.0.0] - 2026-05-20

### Added
- Initial public release of `@genvoris/node`.
- `GenvorisClient` with resources: `customers`, `plans`, `sessions`, `tryon`,
  and the static `webhooks` namespace.
- Full TypeScript type surface re-exported from the root entry point.
- Built-in retry logic with exponential backoff + jitter for `429` and `5xx`
  responses (3 retries default, configurable per request).
- Per-request timeout via `AbortController` (default 30 s).
- HMAC-SHA256 webhook verification (`WebhooksResource.verify`) with
  constant-time signature comparison and configurable clock-skew tolerance.
- Dual CommonJS + ESM build with `.d.ts` + declaration maps + source maps.
- Zero runtime dependencies — uses the Node 18+ built-in `fetch`.

[Unreleased]: https://github.com/DevSajjadAli/genvoris-docs/compare/sdk-v1.1.0...HEAD
[1.1.0]: https://github.com/DevSajjadAli/genvoris-docs/releases/tag/sdk-v1.1.0
[1.0.1]: https://github.com/DevSajjadAli/genvoris-docs/releases/tag/sdk-v1.0.1
[1.0.0]: https://github.com/DevSajjadAli/genvoris-docs/releases/tag/sdk-v1.0.0
