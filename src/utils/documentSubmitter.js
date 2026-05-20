export function getDocumentSubmitterName(doc) {
  return (
    doc?.driverName ||
    doc?.uploaderName ||
    [doc?.user?.firstName, doc?.user?.lastName].filter(Boolean).join(' ') ||
    doc?.user?.email ||
    'Inconnu'
  )
}
