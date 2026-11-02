// The question an import asks when a file's card differs from one on BBO.
// A native <dialog>: window.confirm has only two answers. Card titles come from
// the file, so everything goes in as text. Esc keeps the card on BBO.

/**
 * @returns {Promise<'keep'|'replace'|'both'>}
 */
export function askAboutCard({ title, importedTitle, exportedAt, differences, bothTitle, fileSaved, bboSaved, newer }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog')
    dialog.style.cssText = 'max-width:32em;font:14px sans-serif;padding:1.2em;border:1px solid #888;border-radius:6px'

    const heading = document.createElement('h3')
    heading.textContent = `The file holds a different copy of “${title}”`
    heading.style.cssText = 'margin:0 0 .6em;font-size:16px'
    dialog.appendChild(heading)

    const date = new Date(exportedAt)
    const when = fileSaved
      ? `, saved ${fileSaved.toLocaleString()}`
      : Number.isNaN(date.getTime()) ? '' : `, exported ${date.toLocaleDateString()}`
    const called = importedTitle && importedTitle !== title ? `, called “${importedTitle}”` : ''
    const lines = [
      `The file's copy${called}${when}: ${differences === 1 ? '1 setting differs' : `${differences} settings differ`} from the card on BBO.`,
      bboSaved ? `The card on BBO was saved ${bboSaved.toLocaleString()}.` : "The card on BBO has no saved date.",
      newer
        ? `The ${newer === 'file' ? "file's copy" : 'card on BBO'} is newer.`
        : "We can't tell which is newer: a card saved without this extension has no date.",
    ]
    for (const text of lines) {
      const p = document.createElement('p')
      p.textContent = text
      p.style.margin = '0 0 .6em'
      dialog.appendChild(p)
    }

    const form = document.createElement('form')
    form.method = 'dialog'
    form.style.cssText = 'display:flex;flex-direction:column;gap:.4em;margin-top:1em'
    const buttons = [
      ['keep', `Keep the card on BBO${newer === 'bbo' ? ' (newer)' : ''}`],
      ['replace', `Use the file's copy${newer === 'file' ? ', the newer one' : ''} (replaces “${title}”)`],
      ['both', `Keep both (adds “${bothTitle}”)`],
    ]
    for (const [value, label] of buttons) {
      const button = document.createElement('button')
      button.value = value
      button.textContent = label
      button.style.cssText = 'padding:.4em .8em;cursor:pointer;text-align:left'
      form.appendChild(button)
    }
    dialog.appendChild(form)

    dialog.addEventListener('close', () => {
      const choice = dialog.returnValue
      dialog.remove()
      resolve(choice === 'replace' || choice === 'both' ? choice : 'keep')
    })
    document.body.appendChild(dialog)
    dialog.showModal()
  })
}
