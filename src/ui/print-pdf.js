// Print a PDF's bytes, as the bridge-craftwork.com editor does
// (convention-card's web/src/editor/pdfActions.js): the browser's print dialog
// from a hidden frame, or, where a PDF in a frame prints blank (Safari), the
// PDF in a tab of its own to print from.

/** Whether this browser prints a PDF from a frame. Safari prints it blank. */
export function printsInFrame() {
  const ua = navigator.userAgent
  return !/^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(ua)
}

/**
 * A tab for the PDF, where printsInFrame() is false. Call it in the click,
 * before any await: a browser blocks a tab opened later.
 */
export function openPrintTab() {
  if (printsInFrame()) return null
  const tab = window.open('', '_blank')
  if (tab) tab.document.body.textContent = 'Making the PDF…'
  return tab
}

/**
 * Print the PDF. In a tab, `name` goes on the end of its address: a blob's
 * address is the browser's own (a random id), and a fragment is the one part a
 * page can add, so the address bar says whose card it is.
 */
export function printBytes(bytes, tab = null, name = '') {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  // Long enough to print, or to save it from the tab
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000)
  if (tab) {
    const slug = name.replace(/[^\w\s.-]+/g, '').trim().replace(/\s+/g, '-')
    tab.location.href = slug ? `${url}#${slug}` : url
    return
  }
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  frame.src = url
  frame.onload = () => {
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch {
      window.open(url, '_blank')
    }
  }
  document.body.appendChild(frame)
  // The print dialog holds the frame while it is open; tidy up well after
  setTimeout(() => frame.remove(), 10 * 60_000)
}
