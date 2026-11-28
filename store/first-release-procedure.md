# First release of a new extension: the procedure

A record of what Better BBO Convention Card 1.0.0's first store release took,
kept as it happens (from 27 Nov 2026), so a new extension can follow it. It
also folds in what Bridge Craftwork DD's first listings taught (Edge, Firefox
and the Mac App Store, 22–23 Nov 2026, bridge-classroom-fetch).

Who does each step: **Rick** (a web page only he can use) or **Claude**
(scripts and APIs, with the keys in the Keychain).

Status column: what happened for Better BBO CC. When it's all done, this
becomes the template.

---

## 0. Before any store

| Step | Who | Better BBO CC |
|---|---|---|
| Icon approved | Rick | done 26 Nov |
| Privacy page live on bridge-craftwork-site (every store checks the URL) | Claude PR, Rick merges | done 26–27 Nov |
| Screenshots, 1280×800 at 2× (one set for every store) | Claude (`tools/capture-*.mjs`), only when Rick is off BBO | done 27 Nov |
| Tested on the real site in Chrome, Firefox and Safari | Rick, Claude scripts what it can | done 27 Nov |
| Safari app window: a Getting started list, ending with **Always Allow on Every Website** (Safari can't pre-grant sites; the toolbar button is grey until allowed) | Claude | done 27 Nov |
| Packages: commit everything first (`scripts/package-stores.sh` refuses uncommitted source), then run it. It builds the zips and refreshes the Safari resources in the Xcode project | Claude | |

---

## 1. Mac App Store

| Step | Who | Better BBO CC |
|---|---|---|
| Bundle ID registered. Nothing to do by hand: the first signed archive registers it ("XC …" in developer.apple.com ▸ Identifiers). Run `scripts/upload-apple.sh --no-upload`. The extension target needs no ID of its own | Claude | done 27 Nov |
| Create the app record: Apps ▸ **+** ▸ New App, macOS, name, bundle ID, SKU = the bundle ID's last part, Full Access. The API can't create records | Rick | |
| Upload the build: `scripts/upload-apple.sh` (fresh build number each run) | Claude | |
| Listing: `scripts/app-store-listing.mjs` from `store/app-store.md`: text, URLs, review notes, screenshots, category, age rating, free price, China mainland off, the build | Claude | |
| App Privacy ("Data Not Collected"): the API can't set it | Rick | |
| Add for Review ▸ Submit | Rick | |

Lessons:
- **Never delete an app record to fix it.** Deleting takes the bundle ID with
  it. If it happens, Apps ▸ ⋯ ▸ Removed Apps restores it. Fix a wrong name on
  the version page.
- A Mac app with no App Store category is refused at upload: set
  `LSApplicationCategoryType` (DD: Utilities).
- Untick **China mainland** (Pricing and Availability), or Apple asks for
  filings that don't apply.
- Xcode 27 builds macOS 12.0 and up only.
- `upload-apple.sh` must read the version from Xcode's newer JSON-like
  `project.xcproj` (`"MARKETING_VERSION": "1.0.0"`), not only the old
  `project.pbxproj` form. Fixed 27 Nov.

---

## 2. Firefox (addons.mozilla.org)

| Step | Who | Better BBO CC |
|---|---|---|
| Create the listing. DD's was made in the Developer Hub; it asked for a license | Rick (or Claude through the API, untried) | |
| Upload version, source archive, reviewer notes (3,000-character cap), release notes: `scripts/upload-browsers.mjs firefox --submit` (Fetch's repo adds the extension: `fetch|dd`) | Claude | |
| Listing icon and screenshots: `--images` | Claude | |

---

## 3. Edge (Partner Center)

| Step | Who | Better BBO CC |
|---|---|---|
| Create the extension, fill in the listing and images (the API has no listing fields) | Rick | |
| Send Claude the **Product ID** (Overview page; not secret) | Rick | |
| Put it in `scripts/upload-browsers.mjs`; upload the zip to the draft | Claude | |
| **Publish**: the first one only from Partner Center (the API says "Can't create new extension"). Updates after that go through the API | Rick | |

The API has no status call: check Overview for "In review".

---

## 4. Chrome Web Store

| Step | Who | Better BBO CC |
|---|---|---|
| New item, upload the zip, listing, Privacy practices tab, permission reasons, reviewer notes ("Additional instructions" is dashboard-only), submit | Rick, pasting from `store/submission.md`; Claude opens the files | |

Chrome often publishes without an email: check the dashboard.

---

## 5. After approval

| Step | Who | Better BBO CC |
|---|---|---|
| Record each store's status and link in `store/submission.md` | Claude | |
| Install links on the product page (bridge-craftwork-site) | Claude PR, Rick merges | |

---

## Keys (all in 1Password, synced to the Keychain by `secrets-sync`)

- App Store Connect: `env/personal/ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_BASE64`
- Firefox and Edge: the "Browser Extension API Keys" item → `env/personal/AMO_JWT_ISSUER`, `AMO_JWT_SECRET`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`
- Chrome: none (dashboard only)
