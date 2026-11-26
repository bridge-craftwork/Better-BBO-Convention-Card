// Store screenshots for Better BBO Convention Card, from the live BBO lobby.
//
//   PROFILE=<copy of a signed-in Chromium profile> \
//   CHROMIUM=<path to a Chromium binary> \
//   node tools/capture-cc.mjs [out-dir]
//
// Default out-dir store/screenshots. Loads dist/chrome, so run `npm run build`
// first. Needs pdftoppm (poppler) to show the two PDFs.
//
// Use a COPY of the profile, never the one in use: BBO allows one session per
// account. The profile must have BBO's own `invisible` localStorage flag set
// ("y") so friends aren't told you came online; the script refuses otherwise.
//
// Nothing is written to the account: requests to cc_cud.php (save, delete) and
// www_notify.php are refused at the network, every confirm() is answered no,
// and the import question is answered "keep".
//
// Partners' names, and card titles that hold names, are blurred.
//
// 1280x800 at device scale 2, so 2560x1600: one set for Chrome, Edge, Firefox
// and the Mac App Store, as with Fetch and DD.

import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(process.argv[2] ?? 'store/screenshots')
const PROFILE = process.env.PROFILE
const CHROMIUM = process.env.CHROMIUM
const EXT = path.resolve('dist/chrome')
const WORK = fs.mkdtempSync(path.join(process.env.TMPDIR ?? '/tmp', 'capture-cc-'))
if (!PROFILE) throw new Error('PROFILE must point at a copy of a signed-in Chromium profile')

// Card titles shown unblurred: BBO's stock names, which name nobody.
const SAFE = new Set([
  'ACBL SAYC',
  'BBO Advanced (2/1=GF)',
  'GIB 2/1',
  'SAYC - Standard American Yellow Card',
  'Simple Modern Acol',
  'SAYC',
  'BMW',
  'Title',
  'Partner',
  '↗',
])
// The card pages and PDFs show BBO's stock ACBL SAYC, which names nobody (the
// ACBL template has a box for the players' names). The import uses a card of
// the account's own with a stock name and no partner.
const CARD = process.env.CARD ?? 'ACBL SAYC'
const IMPORT_CARD = process.env.IMPORT_CARD ?? 'BMW'

fs.mkdirSync(OUT, { recursive: true })
const ctx = await chromium.launchPersistentContext(PROFILE, {
  ...(CHROMIUM ? { executablePath: CHROMIUM } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: Number(process.env.SCALE ?? 2),
  acceptDownloads: true,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
})
await ctx.route(/cc_cud\.php|www_notify\.php/, (route) => {
  console.log('refused', route.request().url())
  return route.abort()
})
ctx.on('page', (p) => {
  p.on('dialog', (d) => {
    console.log('dialog:', d.message().split('\n')[0])
    d.dismiss().catch(() => {})
  })
  p.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()))
})
const page = await ctx.newPage()

await page.goto('https://www.bridgebase.com/myhands/index.php')
await page.waitForLoadState('networkidle').catch(() => {})
if ((await page.evaluate(() => localStorage.getItem('invisible'))) !== 'y') {
  throw new Error('BBO invisible flag not set in this profile; refusing to sign in visibly')
}
// Widen the right-hand panel, where Account opens. BBO keeps its width in
// "<user>_hDividePixels"; this is a copy of the profile, so changing it touches
// nothing real.
await page.evaluate((px) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('_hDividePixels'))
  if (key) localStorage.setItem(key, px)
}, process.env.DIVIDER ?? '760')
await page.goto('https://www.bridgebase.com/v3/')
await page.waitForTimeout(9000)
// The lobby greets with a Mail box over the middle.
for (const close of await page.locator('.mat-mdc-dialog-container svg-icon, .closeClass').filter({ visible: true }).all()) {
  await close.click().catch(() => {})
}
await page.keyboard.press('Escape').catch(() => {})
await page.locator('.area-label:text-is("Account")').click()
await page.waitForTimeout(1500)
await page.getByText('Convention cards', { exact: true }).filter({ visible: true }).first().click()
await page.waitForTimeout(5000)
const list = page.frames().find((f) => f.url().includes('acblCCFM'))
if (!list) throw new Error('the convention card list did not open')
await list.locator('text=Better BBO CC:').waitFor()

async function blurList() {
  await list.evaluate((safe) => {
    const ok = new Set(safe)
    for (const row of document.querySelectorAll('a.card-item')) {
      for (const el of row.querySelectorAll('*')) {
        if (el.children.length || !el.textContent.trim()) continue
        el.style.filter = ok.has(el.textContent.trim()) ? '' : 'blur(5px)'
      }
    }
  }, [...SAFE])
}
async function shot(p, name) {
  await p.mouse.move(2, 2)
  await p.waitForTimeout(400)
  await p.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log('wrote', path.join(OUT, `${name}.png`))
}
// A PDF's first page, shown the way a PDF viewer shows it: on grey, with a
// shadow, filling the frame.
async function showPdf(pdf, name) {
  const png = path.join(WORK, `${name}`)
  execFileSync('pdftoppm', ['-png', '-r', '220', '-f', '1', '-l', '1', '-singlefile', pdf, png])
  const viewer = await ctx.newPage()
  const data = fs.readFileSync(`${png}.png`).toString('base64')
  await viewer.setContent(`<!doctype html><style>
    html,body{margin:0;height:100%;background:#525659}
    body{display:flex;align-items:center;justify-content:center}
    img{max-width:94vw;max-height:94vh;box-shadow:0 4px 18px rgba(0,0,0,.5);background:#fff}
  </style><img src="data:image/png;base64,${data}">`)
  await shot(viewer, name)
  await viewer.close()
}

// 1. The list, with the extension's toolbar and a ↗ on each row.
await blurList()
await shot(page, '1-card-list')

// 2. The card in a tab of its own, from its ↗.
const row = list.locator('a.card-item', { hasText: CARD }).first()
const [cardPage] = await Promise.all([ctx.waitForEvent('page'), row.locator('text=↗').click()])
await cardPage.waitForLoadState('load')
await cardPage.waitForTimeout(5000)
await cardPage.locator('text=Better CC:').waitFor()
await shot(cardPage, '2-card-page')

// 3. What Print (fixed) prints: the extension scales the card on beforeprint.
await cardPage.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
await cardPage.emulateMedia({ media: 'print' })
const printed = path.join(WORK, 'print.pdf')
await cardPage.pdf({ path: printed, preferCSSPageSize: true, printBackground: true })
await cardPage.emulateMedia({ media: 'screen' })
await cardPage.evaluate(() => window.dispatchEvent(new Event('afterprint')))
await showPdf(printed, '3-print')

// 4. The ACBL Classic card the extension renders.
const [download] = await Promise.all([
  cardPage.waitForEvent('download'),
  cardPage.locator('button', { hasText: /^PDF: .*Classic/ }).click(),
])
const acbl = path.join(WORK, 'acbl.pdf')
await download.saveAs(acbl)
await showPdf(acbl, '4-acbl-pdf')
await cardPage.close()

// 5. The import question, for a file whose copy of the card differs from
//    BBO's. The file is this account's own export, with one card changed.
const [exported] = await Promise.all([
  page.waitForEvent('download'),
  list.locator('button', { hasText: 'Export my cards as JSON' }).click(),
])
const envelope = JSON.parse(fs.readFileSync(await exported.path(), 'utf8'))
fs.writeFileSync(path.join(WORK, 'export.json'), JSON.stringify(envelope, null, 2))
const card = envelope.cards.find((c) => c.title === IMPORT_CARD && !c.partner && !c.stock)
if (!card) throw new Error(`no personal "${IMPORT_CARD}" card without a partner in the export`)
const changed = structuredClone(card)
mutate(changed)
const file = path.join(WORK, 'import.json')
fs.writeFileSync(file, JSON.stringify({ ...envelope, cards: [changed] }))
const [chooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  list.locator('button', { hasText: 'Import from JSON or PDF' }).click(),
])
await chooser.setFiles(file)
await list.locator('dialog[open], form button[value="keep"]').first().waitFor({ timeout: 30000 })
await page.waitForTimeout(800)
await blurList()
await shot(page, '5-import')
await list.locator('button[value="keep"]').click()
await page.waitForTimeout(2000)

await page.goto('about:blank').catch(() => {})
await ctx.close()
console.log('work files in', WORK)

// Change a few of the card's answers, as an edit in another editor would.
function mutate(c) {
  const fields = c.fields ?? c.data ?? c
  let n = 0
  for (const [k, v] of Object.entries(fields)) {
    if (n >= 3) break
    if (typeof v === 'string' && v.length > 0 && v.length < 40 && !/title|partner|key|owner|style|date|saved/i.test(k)) {
      fields[k] = `${v} (2)`
      n++
    }
  }
}
