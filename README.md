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

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
