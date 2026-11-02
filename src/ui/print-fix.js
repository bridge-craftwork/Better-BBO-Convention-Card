// Print fix for the BBO convention-card editor pages.
//
// BBO's "Print" button is plain window.print() with no print stylesheet. The
// card layout is 1786px-wide landscape; Chrome shrinks it to fit a portrait
// page and clips the rightmost column. We fix this by:
//   1. Installing a static @media print stylesheet that hides chrome, switches
//      @page to landscape letter, and prevents row-splitting at page breaks.
//   2. On `beforeprint`, measuring the actual card width and injecting a
//      transform: scale so the card fits across the landscape page exactly.
//
// Card-format-aware: the ACBL editor uses #entireTable inside #ccDiv inside
// #mainDiv. V2BASIC/V1BASIC/CC have different DOMs — apply() inspects the
// page and chooses the best target element it can find. If no plausible
// target is present, it silently no-ops; we'd rather miss the fix than break
// the page.

const RUNTIME_STYLE_ID = 'better-bbo-cc-print-runtime'
const STATIC_STYLE_ID = 'better-bbo-cc-print-static'

const STATIC_CSS = `
@media print {
  #buttonDiv,
  .form-header,
  .buttonStyle,
  button.btn,
  .print-button,
  .no-print {
    display: none !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
  }
  #entireTable td,
  #entireTable tr,
  table.ccTable td,
  table.ccTable tr {
    page-break-inside: avoid !important;
  }
}
@page {
  size: letter landscape;
  margin: 0.3in;
}
`

/**
 * Install the print fix on the current page. Idempotent — calling twice
 * does no harm. Safe to call on any of the editor URLs; it gracefully
 * no-ops on pages whose DOM doesn't match (e.g., V1BASIC's PHP-rendered
 * HTML page that doesn't expose the same structure).
 */
export function applyPrintFix() {
  installStaticStyles()
  window.addEventListener('beforeprint', injectRuntimeScale)
  window.addEventListener('afterprint', removeRuntimeScale)
}

function installStaticStyles() {
  if (document.getElementById(STATIC_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STATIC_STYLE_ID
  style.textContent = STATIC_CSS
  document.head.appendChild(style)
}

function injectRuntimeScale() {
  removeRuntimeScale()

  const target = findScaleTarget()
  if (!target) return

  const naturalWidth = target.getBoundingClientRect().width
  if (!Number.isFinite(naturalWidth) || naturalWidth <= 0) return

  // Landscape letter with 0.3in margins → ~10.4in printable width → ~998px
  // at 96dpi.
  const printableWidthPx = (11 - 0.3 * 2) * 96
  const scale = printableWidthPx / naturalWidth

  // We avoid scaling up; if the card is already narrower than the page
  // we just print at 1:1 and let the static stylesheet handle the rest.
  const effectiveScale = scale < 1 ? scale : 1

  const css = `
@media print {
  #mainDiv {
    position: static !important;
    width: ${naturalWidth}px !important;
    height: auto !important;
    overflow: visible !important;
    transform: scale(${effectiveScale.toFixed(4)});
    transform-origin: top left;
  }
  #ccDiv {
    position: static !important;
    top: 0 !important;
    width: ${naturalWidth}px !important;
    height: auto !important;
    overflow: visible !important;
    visibility: visible !important;
  }
}
`.trim()

  const style = document.createElement('style')
  style.id = RUNTIME_STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}

function removeRuntimeScale() {
  const existing = document.getElementById(RUNTIME_STYLE_ID)
  if (existing) existing.remove()
}

function findScaleTarget() {
  // Preferred: the ACBL card has #entireTable as its outermost content table.
  return (
    document.getElementById('entireTable') ||
    document.querySelector('table.ccTable') ||
    document.getElementById('ccDiv') ||
    document.getElementById('mainDiv')
  )
}
