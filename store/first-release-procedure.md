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
| Create the app record: Apps ▸ **+** ▸ New App, macOS, name, bundle ID, SKU = the bundle ID's last part, Full Access (Limited only matters with other team members). The API can't create records | Rick | done 27 Nov (app id 6840230386) |
| Upload the build: `scripts/upload-apple.sh` (fresh build number each run). Apple takes 15–30 minutes to process it | Claude | done 27 Nov, build 202611271833 |
| Set the version page to the manifest's version: a new record starts at **1.0**, and the listing script only attaches a build whose version matches. One API call: PATCH `/v1/appStoreVersions/<id>` `versionString` | Claude | done 27 Nov (1.0 → 1.0.0) |
| Listing: `scripts/app-store-listing.mjs` (try `--dry-run` first) from `store/app-store.md`: text, URLs, review notes, screenshots, category, age rating, free price, China mainland off | Claude | done 27 Nov |
| Attach the build once processed: `scripts/app-store-listing.mjs --only build` | Claude | done 27 Nov |
| App Privacy ("Data Not Collected"): the API can't set it | Rick | |
| Add for Review ▸ Submit | Rick | done 27 Nov: Waiting for Review |

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
| Rick says go: creating the listing submits it for review at once | Rick | done 27 Nov |
| Create the listing **and** submit 1.0.0 in one run, no Developer Hub: `scripts/upload-browsers.mjs firefox --submit`. When AMO has no add-on with the manifest's gecko id, it validates the zip, creates the add-on with the listing from `store/submission.md` (name, summary, description, homepage, support URL, category, license), the reviewer notes (3,000-character cap) and release notes, then attaches the source archive. Updates use the same command | Claude | done 27 Nov: add-on 3144782, `better-bbo-convention-card`, nominated |
| Listing icon and screenshots: `scripts/upload-browsers.mjs firefox --images` | Claude | |

Lessons:
- AMO's license slugs are SPDX-style and case-sensitive: `Unlicense`, not
  `unlicense` (a wrong one is refused with nothing created). Fetch and DD use
  the same. Check `package.json`'s license before choosing.
- DD's first listing was made in the Developer Hub; the API does it as well.

---

## 3. Edge (Partner Center)

| Step | Who | Better BBO CC |
|---|---|---|
| Create the extension, fill in the listing and images (the API has no listing fields) | Rick | done 27 Nov |
| Send Claude the **Product ID** (Overview page; not secret) | Rick | done 27 Nov: 1753b319-4417-422a-9378-b542e61eb2f5 |
| Put it in `scripts/upload-browsers.mjs`; upload the zip to the draft: `scripts/upload-browsers.mjs edge` (no `--submit`) | Claude | done 27 Nov |
| Paste the notes for certification into Partner Center (Claude writes them to a text file to copy; only `--submit` sends them, and a first listing can't use it). Also search terms and screenshot titles, from `store/submission.md` | Rick | done 27 Nov |
| **Publish**: the first one only from Partner Center (the API says "Can't create new extension"). Updates after that go through the API | Rick | done 27 Nov |

The API has no status call: check Overview for "In review".

---

Tip: Claude renders `store/submission.md` to a local HTML page with a Copy
button on each block (pandoc), for pasting into the dashboards; TextEdit only
shows the Markdown.

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
