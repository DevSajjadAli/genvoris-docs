# Changelog

All notable changes to `@genvoris/node` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/DevSajjadAli/genvoris-docs/compare/sdk-v1.0.0...HEAD
[1.0.0]: https://github.com/DevSajjadAli/genvoris-docs/releases/tag/sdk-v1.0.0
