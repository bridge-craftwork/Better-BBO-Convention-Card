// Bytes copied into an array of this script's own realm.
//
// In a Firefox content script, an ArrayBuffer from fetch() or File.arrayBuffer()
// belongs to the page's realm. pdf-lib then fails its instanceof checks ("must
// be of type ... but was actually of type NaN"), or touches a property the
// realm boundary forbids ("Permission denied to access property
// \"constructor\""). A copy made here has neither problem; elsewhere it is
// just a copy.
export function ownBytes(buffer) {
  const bytes = new Uint8Array(buffer)
  const own = new Uint8Array(bytes.length)
  own.set(bytes)
  return own
}
