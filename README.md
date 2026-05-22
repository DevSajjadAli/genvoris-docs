# Genvoris Docs

Public developer documentation for [Genvoris](https://genvoris.org). Built with [Docusaurus](https://docusaurus.io/).

## Local development

```bash
npm install
npm run start
```

Opens http://localhost:3000 with hot reload.

## Build

```bash
npm run build
npm run serve
```

## Structure

- `docs/intro.md` — landing page (mounted at `/`)
- `docs/quickstart.md` — 5-minute integration walkthrough
- `docs/concepts.md` — credit packs, plans, customers, sessions
- `docs/api/*.md` — REST API reference per resource
- `docs/integrations/*.md` — Shopify / WordPress / custom recipes
- `docs/security.md` — auth, data handling, vuln reporting

## Deployment

The site is hosted at <https://docs.genvoris.org>. Push to `main` triggers a CI build that deploys the `build/` output. To deploy manually:

```bash
npm run build
# upload ./build to the static host (Cloudflare Pages, Netlify, etc.)
```

## Editing pages

- Source is plain Markdown with frontmatter.
- Sidebar order lives in [`sidebars.ts`](./sidebars.ts).
- Header / footer / nav config lives in [`docusaurus.config.ts`](./docusaurus.config.ts).
- Each page has an `editUrl` pointing back at GitHub for the "Edit this page" footer link.
