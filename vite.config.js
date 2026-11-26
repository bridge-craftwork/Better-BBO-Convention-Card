import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import baseManifest from './manifest.json' with { type: 'json' }

// One source, four browsers. `BROWSER=firefox npm run build` (etc.) emits a
// per-browser bundle in dist/<browser>/; scripts/package-stores.sh builds and
// zips them all. The whole per-browser difference is the object below.
const BROWSER = process.env.BROWSER ?? 'chrome'

const PER_BROWSER_OVERRIDES = {
  // Chrome and Edge use the base Chromium MV3 manifest unchanged.
  chrome: {},
  edge: {},

  // Firefox MV3 needs a fixed add-on id, and the event-page background.scripts
  // form rather than background.service_worker (which @crxjs's firefox build
  // path requires).
  //
  // data_collection_permissions is required of new Firefox add-ons and shown
  // at install. "Collect" there means "leaves the device", not "reaches us":
  // the hand-off links ("Edit on Bridge Craftwork", "Save to Bridge Classroom")
  // carry the card, which can hold the partnership's names, to those sites
  // when the user clicks one. Hence both terms, as Bridge Classroom Fetch and
  // Bridge Craftwork DD declare. store/submission.md § Data use says the same
  // to Chrome and Edge; keep them in step.
  //
  // The key landed in Firefox 140, which sets the floor. No gecko_android:
  // BBO's phone and tablet lobby is a different page this doesn't run on.
  firefox: {
    background: {
      scripts: [baseManifest.background.service_worker],
    },
    browser_specific_settings: {
      gecko: {
        id: 'better-bbo-convention-card@bridge-classroom.org',
        strict_min_version: '140.0',
        data_collection_permissions: {
          required: ['personallyIdentifyingInfo', 'websiteContent'],
        },
      },
    },
  },

  // Safari takes the Chromium manifest at build time. dist/safari/ is copied
  // into the Xcode project in safari/ by scripts/package-stores.sh, and the
  // app is archived and uploaded by scripts/upload-apple.sh.
  safari: {},
}

if (!Object.hasOwn(PER_BROWSER_OVERRIDES, BROWSER)) {
  throw new Error(
    `Unknown BROWSER=${BROWSER}. Supported: ${Object.keys(PER_BROWSER_OVERRIDES).join(', ')}.`
  )
}

const manifest = { ...baseManifest, ...PER_BROWSER_OVERRIDES[BROWSER] }

// App Store Connect refuses a Safari extension whose manifest description is
// over 112 characters (error 90849, and only after the upload). Chrome allows
// 132. scripts/package-stores.sh checks both.
const SAFARI_DESCRIPTION =
  'Print, back up and share your Bridge Base Online convention cards: ACBL PDFs, JSON and PDF import and export.'
if (BROWSER === 'safari') manifest.description = SAFARI_DESCRIPTION

export default defineConfig({
  plugins: [crx({ manifest, browser: BROWSER === 'firefox' ? 'firefox' : 'chrome' })],
  build: {
    outDir: process.env.OUT_DIR ?? `dist/${BROWSER}`,
    emptyOutDir: true,
  },
})
