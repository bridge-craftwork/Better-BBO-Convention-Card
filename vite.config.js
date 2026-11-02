import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import baseManifest from './manifest.json' with { type: 'json' }

// Cross-browser builds. Today only Chrome is published, but the structure
// supports Edge / Firefox / Safari without source changes. Run e.g.
// `BROWSER=firefox npm run build` to emit a per-browser bundle.
const BROWSER = process.env.BROWSER ?? 'chrome'

const PER_BROWSER_OVERRIDES = {
  // Chrome and Edge use the base Chromium MV3 manifest unchanged.
  chrome: {},
  edge: {},

  // Firefox MV3 requires a unique extension id under browser_specific_settings
  // and uses the event-page background.scripts form (the @crxjs/vite-plugin
  // firefox build path requires this rather than background.service_worker).
  firefox: {
    background: {
      scripts: ['src/background.js'],
    },
    browser_specific_settings: {
      gecko: {
        id: 'better-bbo-convention-card@bridge-classroom.org',
        strict_min_version: '121.0',
      },
    },
  },

  // Safari accepts the Chrome MV3 manifest at build time. Final
  // distribution to the Mac/iOS App Store requires running dist/safari/
  // through Xcode's `safari-web-extension-converter`.
  safari: {},
}

if (!Object.hasOwn(PER_BROWSER_OVERRIDES, BROWSER)) {
  throw new Error(
    `Unknown BROWSER=${BROWSER}. Supported: ${Object.keys(PER_BROWSER_OVERRIDES).join(', ')}.`
  )
}

const manifest = { ...baseManifest, ...PER_BROWSER_OVERRIDES[BROWSER] }

export default defineConfig({
  plugins: [crx({ manifest, browser: BROWSER === 'firefox' ? 'firefox' : 'chrome' })],
  build: {
    outDir: `dist/${BROWSER}`,
    emptyOutDir: true,
  },
})
