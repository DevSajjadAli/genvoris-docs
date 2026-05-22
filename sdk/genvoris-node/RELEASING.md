# How to release `@genvoris/node`

The SDK is published to the public npm registry by GitHub Actions. The
workflow lives in `.github/workflows/sdk-publish.yml` of the
`DevSajjadAli/genvoris-docs` repository and triggers on any tag whose
name matches `sdk-v*`.

## Steps

1. Make and commit all SDK changes inside `sdk/genvoris-node/`.
2. Update `sdk/genvoris-node/CHANGELOG.md` with a new section describing
   what changed. Move items out of `## [Unreleased]` into a dated
   release section.
3. Bump the version inside the SDK package:

   ```bash
   cd sdk/genvoris-node
   npm version patch   # bug fixes:     1.0.0 → 1.0.1
   npm version minor   # new features:  1.0.0 → 1.1.0
   npm version major   # breaking:      1.0.0 → 2.0.0
   ```

   `npm version` rewrites `package.json` and creates a local commit and
   a `vX.Y.Z` tag. **Delete that auto-generated tag** — the publish
   workflow listens for the `sdk-v*` prefix instead, so we tag manually
   below:

   ```bash
   git tag -d "v$(node -p "require('./package.json').version")"
   ```

4. From the repo root, push the version bump commit, then create and
   push the SDK-prefixed tag:

   ```bash
   cd ../..
   git push origin main
   VER=$(node -p "require('./sdk/genvoris-node/package.json').version")
   git tag "sdk-v$VER"
   git push origin "sdk-v$VER"
   ```

5. GitHub Actions (`.github/workflows/sdk-publish.yml`) runs
   automatically. Watch it at:
   `https://github.com/DevSajjadAli/genvoris-docs/actions`
6. Verify the package is live: <https://www.npmjs.com/package/@genvoris/node>
7. Verify the GitHub Release was created at:
   `https://github.com/DevSajjadAli/genvoris-docs/releases`

## Required GitHub Secrets

Set once in the repository **Settings → Secrets and variables → Actions**:

| Name        | Where to get it                                                  |
| ----------- | ---------------------------------------------------------------- |
| `NPM_TOKEN` | npm.com → user → Access Tokens → "Automation" (does not expire). |

The `--provenance` flag in `npm publish` requires `id-token: write`
workflow permission, which is already configured in the workflow file.
No additional secret is needed for provenance.

## Rollback

If a bad version is published, **never** unpublish — it breaks every
consumer that has already installed it. Instead, deprecate it and push
a fixed patch release:

```bash
npm deprecate "@genvoris/node@1.2.3" "Critical bug; please upgrade to 1.2.4."
```

Then follow steps 1–7 again to ship `1.2.4`.

## CI vs Publish

* `sdk-ci.yml` runs on every push or PR that touches
  `sdk/genvoris-node/**`. Matrix: Node 18, 20, 22. It blocks merges on
  type errors, test failures, or broken builds.
* `sdk-publish.yml` runs only on `sdk-v*` tag pushes. It re-runs the
  full pipeline, then publishes with provenance and drafts a GitHub
  Release.

Both workflows are pinned to action SHAs / major versions for supply
chain safety. Bump them deliberately and review the diff.
