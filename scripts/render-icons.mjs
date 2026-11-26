// Rasterise icons/icon.svg into every size the four stores want.
//
//   node scripts/render-icons.mjs
//
// Chromium renders, through Playwright (a dev dependency): the icon should be
// rasterised by the engine that will show it. Adapted from bridge-classroom-fetch.
//
// Outputs, all from the one source:
//   icons/icon-{16,24,32,48,96,128,300}.png   manifest, toolbar action, Firefox, Edge listing
//   icons/icon-macos.svg                       the inset Mac variant, to look at
//   safari/…/AppIcon.appiconset/*.png          the Mac app's icon set, once the
//                                              Xcode project exists
//
// Re-run after editing icon.svg and commit the PNGs: they are build inputs the
// stores consume, not build output, so the build itself needs no browser.

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'icons/icon.svg'
const OUT = 'icons'
const SAFARI =
  'safari/Better BBO Convention Card/Better BBO Convention Card/Assets.xcassets/AppIcon.appiconset'

// 16/32/48/128 are the manifest set; 24 is for the toolbar on some display
// scales; 96 is Firefox's listing; 300 is Edge's store logo.
const EXTENSION_SIZES = [16, 24, 32, 48, 96, 128, 300]

// The catalog's slots come to these pixel sizes once @2x is resolved.
const SAFARI_SIZES = [16, 32, 64, 128, 256, 512, 1024]

const svg = fs.readFileSync(SRC, 'utf8')

// A toolbar icon is full-bleed; a Mac app icon is not. Apple's grid puts the
// rounded square at 824x824 in a 1024 canvas, corner radius 185.4. The mark is
// lifted out of icon.svg rather than redrawn, so the two cannot drift apart.
const MACOS_CANVAS = 1024
const MACOS_INSET = 100
const MACOS_SIDE = MACOS_CANVAS - MACOS_INSET * 2
const MACOS_RADIUS = 185.4
const GLYPH_GRID = 64

function macosSvg() {
  const glyph = svg.match(/<g id="glyph">([\s\S]*?)<\/g>\s*<\/svg>/)
  if (!glyph) throw new Error('icon.svg has no <g id="glyph"> to lift — did the source change?')
  const scale = MACOS_SIDE / GLYPH_GRID
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MACOS_CANVAS} ${MACOS_CANVAS}" width="${MACOS_CANVAS}" height="${MACOS_CANVAS}">
  <rect x="${MACOS_INSET}" y="${MACOS_INSET}" width="${MACOS_SIDE}" height="${MACOS_SIDE}" rx="${MACOS_RADIUS}" fill="#1a73e8"/>
  <g transform="translate(${MACOS_INSET} ${MACOS_INSET}) scale(${scale})">${glyph[1]}</g>
</svg>
`
}

async function render(page, size, outPath, source = svg, grid = GLYPH_GRID) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    '<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>' +
      source.replace(`width="${grid}" height="${grid}"`, `width="${size}" height="${size}"`)
  )
  await page.locator('svg').screenshot({ path: outPath, omitBackground: true })
}

// PW_CHROMIUM points at a Chromium build when the one Playwright expects isn't installed.
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage()

for (const size of EXTENSION_SIZES) await render(page, size, path.join(OUT, `icon-${size}.png`))

const macos = macosSvg()
fs.writeFileSync(path.join(OUT, 'icon-macos.svg'), macos)

const contentsPath = path.join(SAFARI, 'Contents.json')
const haveCatalog = fs.existsSync(contentsPath)
if (haveCatalog) {
  for (const size of SAFARI_SIZES) {
    await render(page, size, path.join(SAFARI, `icon-${size}.png`), macos, MACOS_CANVAS)
  }
}
await browser.close()

if (!haveCatalog) {
  console.log(`icons: ${EXTENSION_SIZES.length} extension; no Xcode project at ${SAFARI} yet, Mac icon skipped`)
  process.exit(0)
}

// Point the asset catalog at what was just written. A 32x32 @2x slot needs the 64px file.
const contents = JSON.parse(fs.readFileSync(contentsPath, 'utf8'))
let filled = 0
for (const image of contents.images) {
  if (image.appearances || image.platform === 'ios') continue
  const px = Number.parseInt(image.size, 10) * Number.parseInt(image.scale ?? '1', 10)
  if (!SAFARI_SIZES.includes(px)) continue
  image.filename = `icon-${px}.png`
  filled++
}
fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2) + '\n')
console.log(`icons: ${EXTENSION_SIZES.length} extension, ${SAFARI_SIZES.length} safari, ${filled} catalog slots filled`)
