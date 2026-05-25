---
sidebar_position: 99
title: Performance budget
description: Bundle-size, time-to-interactive, and backend latency budgets that every Genvoris release must stay within.
---

# Performance budget

Every shippable component (widget, Shopify app block, WordPress plugin, SDKs, Python backend) has a hard ceiling. PRs that bust a ceiling are blocked at review unless the doc is updated in the same PR with a justification.

## Frontend (widget.js + widget.css)

| Metric | Budget | Current (post Phase 1) | Headroom |
| --- | --- | --- | --- |
| `widget.js` raw | 100 KB | ~87 KB | 13 KB |
| `widget.js` gzipped | 35 KB | ~22 KB est. | 13 KB |
| `widget.css` raw | 15 KB | ~8.4 KB | 6.6 KB |
| Total CSS+JS gzip | 45 KB | ~28 KB est. | 17 KB |
| Time-to-first-byte (`widget.js` from api.genvoris.org) | 200 ms p75 | not yet measured | — |
| Time-to-interactive on a mid-tier mobile (Moto G4, 3G fast) | 1.5 s | not yet measured | — |
| Lighthouse "Best Practices" on a sample storefront | ≥ 95 | 100 | — |

### Why these numbers

- **100 KB raw** — at gzip ratio ~25-30%, that's ~30 KB on the wire; under the 50 KB tipping point where adding our script noticeably shifts Core Web Vitals on a typical Shopify product page.
- **15 KB raw CSS** — Shadow DOM stylesheet, no Tailwind reset bleed, no font files. If this grows past 15 KB the most likely cause is theme bloat that should be Shadow-scoped, not stuffed in here.

### Tracked regressions

When a phase pushes a number up, log it here so we can spot drift:

| Phase | Component | Delta | Reason |
| --- | --- | --- | --- |
| 1A | widget.js | +5 KB | `GenvorisStyleDetector` + CSS variable wiring |
| 1C/E/G | widget.js | +10 KB | State machine, focus trap, RTL, 2 new locales |
| 1H | widget.js | +1 KB | Version exposure + product detection polish |

## Backend (Python upstream, `python-backend/backend/*`)

| Metric | Budget |
| --- | --- |
| `/status` p95 latency | 100 ms |
| `/tryon` p95 latency | 60 s (per-image generation is the bottleneck — UX masks this with progress) |
| Per-instance memory ceiling | 1 GB |
| Cold start | 5 s |

These are not yet enforced in CI. **Phase 9 follow-up:** wire `pytest-benchmark` against `/status` and fail CI on > 100 ms p95 against the local SQLite fixture.

## Per-shop / per-IP rate limits

| Endpoint | Limit |
| --- | --- |
| Shopify app proxy (any path) | 20 req/min/shop (sticky on subdomain) |
| WordPress proxy (any path) | 30 req/min/IP |
| Public widget loader | 60 req/min/IP |
| Upstream `/tryon` | 10 req/min/account |

Rate-limit breaches return HTTP 429 with `Retry-After`. The widget shows a non-blocking toast and re-enables the trigger after the header value elapses.

## Bundle-size enforcement

The simplest pre-merge check is a `du`-style assertion. Add to your release script (an example for the widget):

```bash
size=$(wc -c < widget.js)
if [ "$size" -gt 102400 ]; then
  echo "widget.js exceeds 100 KB budget ($size bytes)"
  exit 1
fi
```

A future release will move this into a GitHub Action.

## What is intentionally NOT a budget

- **Total page weight** — that's the host theme's concern; we don't load fonts, third-party CSS, or images on init.
- **Network request count on init** — we do at most `widget.js` (cached), `/status` (cached), and the storefront's own product images. No analytics beacon, no font fetch, no third-party SDK.

## Reviewing this doc

Every major release: re-measure the numbers in the "current" column, update the deltas table, and bump any budget that has changed.
