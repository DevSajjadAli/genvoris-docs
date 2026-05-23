#!/usr/bin/env node
/**
 * Render the brand SVG social card to PNG.
 *
 * Open Graph and Twitter/X scrapers still rely on PNG/JPG for previews
 * (LinkedIn accepts SVG; X and Slack do not). The canonical source is
 * the SVG at `static/img/genvoris-social-card.svg` — this script just
 * rasterises it to a 1200×630 PNG sitting next to it.
 *
 * Usage:
 *   npm install --save-dev sharp
 *   node scripts/build-social-card.mjs
 *
 * Run once after editing the SVG, then commit both files. The build
 * does NOT depend on `sharp` — if you skip running this script the
 * SVG is still served (and LinkedIn / Slack will preview it fine; X
 * will fall back to no image). The Docusaurus config can be flipped
 * to point at the PNG once it's generated.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '..', 'static', 'img', 'genvoris-social-card.svg')
const pngPath = join(__dirname, '..', 'static', 'img', 'genvoris-social-card.png')

if (!existsSync(svgPath)) {
  console.error(`[social-card] missing source: ${svgPath}`)
  process.exit(1)
}

let sharp
try {
  ;({ default: sharp } = await import('sharp'))
} catch {
  console.error(
    '[social-card] `sharp` is not installed. Run `npm install --save-dev sharp` first.',
  )
  process.exit(1)
}

mkdirSync(dirname(pngPath), { recursive: true })

await sharp(svgPath, { density: 144 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toFile(pngPath)

console.log(`[social-card] wrote ${pngPath}`)
