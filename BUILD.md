# Build instructions

For addons.mozilla.org source review. These steps reproduce the uploaded
package exactly; we check that before every submission by extracting this
archive into a clean directory and diffing the result against the artifact.

## Requirements

| | |
|---|---|
| Operating system | Any that runs Node.js. Built and verified on macOS 26 (arm64); nothing in the build is platform-specific |
| Node.js | **22 or newer** (the convention-card dependency requires 22). Built and verified with **22.11.0** |
| npm | **10 or newer**. Built and verified with **10.9.0** |
| Network | Needed once, for `npm ci` to fetch the dependencies in `package-lock.json` |

Install Node.js from <https://nodejs.org/>; the LTS installer includes npm.
Check with:

```bash
node --version    # v22.11.0
npm --version     # 10.9.0
```

No other tool is required: no global npm packages, no compilers, no native
build steps.

## Build

One command, from the root of this archive:

```bash
./build.sh
```

That script is the whole process. It runs:

```bash
npm ci                          # exact dependency versions from package-lock.json
BROWSER=firefox npx vite build  # output in dist/firefox/
```

**`dist/firefox/`** is the contents of the uploaded package: zip that
directory and you have the submitted file.

One dependency, `@bridge-craftwork/convention-card`, is installed from a
tagged GitHub release (`github:bridge-craftwork/convention-card#v0.45.2` in
`package.json`, pinned to a commit in `package-lock.json`). It is our own
open-source library (MIT OR Apache-2.0), from the same organisation, and npm
fetches it like any other package. Nothing else is fetched at build time.

## What the build does

- **Vite 6** bundles the ES modules and minifies the result (Rollup underneath).
- **@crxjs/vite-plugin 2** emits the manifest and the content-script loaders.
- `BROWSER=firefox` selects the Firefox manifest details in `vite.config.js`:
  `browser_specific_settings.gecko` and the event-page `background.scripts`
  form in place of `background.service_worker`. The whole per-browser
  difference is one small object in that file.
- The two blank ACBL card PDFs and the Barlow Condensed font come from the
  convention-card package and are copied into `assets/`, where the extension
  reads them with `runtime.getURL` to fill in a card. They are data, not code.

The add-on fetches no code at run time: no remote scripts, no `eval` of our
own (see the linter note below).

## Source layout

```
src/
  background.js        opens the hand-off links in a new tab
  ui/                  content scripts: the card list, the card pages, print fix,
                       import dialog; two small page-world scripts (below)
  parsers/             BBO's XML responses, and our JSON format
  lib/                 auth from the page URL, import planning, PDFs, notices
manifest.json          the base manifest; vite.config.js layers per-browser keys on
icons/                 committed PNGs, rasterised from icon.svg
public/licenses/       the font's licence, shipped beside it
tests/                 unit tests (vitest), with saved BBO responses as fixtures
safari/                the Xcode project for the Safari build (not used here)
docs/                  design notes, including everything known about BBO's card API
```

`icons/*.png` are committed rather than generated during the build. They come
from `icons/icon.svg` by `node scripts/render-icons.mjs`, which needs
Playwright's Chromium; that step is kept out of the build so building needs no
browser download.

**The two `world: "MAIN"` content scripts.** `src/ui/listPageWorld.js` copies
each card row's jQuery data onto a `data-` attribute, so the isolated content
script can read which card a row is; `src/ui/editorPageWorld.js` wraps BBO's
`XMLHttpRequest` on the card page to add a save date to the card BBO's own
editor saves. Both run in the page because BBO's iframe forbids inline script
(CSP `script-src 'self'`), and both are a few lines long.

## Tests, if useful

Not required to build, but they run offline and quickly:

```bash
npm test          # 97 unit tests
```

## A note on the two linter warnings

`addons-linter` reports two `DANGEROUS_EVAL` warnings, both in the bundled
`assets/acblClassicFillPdf-*.js` chunk, and both inside **@pdf-lib/fontkit**,
whose published package is a prebuilt bundle that includes them:

- `Function("binder", "return function (…)")` is the `function-bind` polyfill,
  which fontkit's bundle carries from its own dependencies.
- `"%eval%": eval` is `get-intrinsic`'s table of built-ins: a reference to
  `eval`, never a call.

Both are in `node_modules/@pdf-lib/fontkit/dist/fontkit.es.js` exactly as
published (`grep -n '%eval%' node_modules/@pdf-lib/fontkit/dist/fontkit.es.js`).
Neither runs on the paths the extension uses, and MV3's content security
policy would refuse either if it did. No first-party source uses `eval` or the
`Function` constructor:

```bash
grep -rnE 'eval\(|new Function|Function\(' src/    # no matches
```
