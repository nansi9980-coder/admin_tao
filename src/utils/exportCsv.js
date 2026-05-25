/**
 * Exporte un tableau d'objets en CSV.
 * @param {string} filename - Nom du fichier (sans extension).
 * @param {Array<Object>} rows - Données.
 * @param {Array<{key: string, label?: string, format?: (v:any,row:any)=>string}>} columns
 */
export function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return false
  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(rows[0]).map((k) => ({ key: k, label: k }))

  const escape = (v) => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = cols.map((c) => escape(c.label || c.key)).join(',')
  const lines = rows.map((row) =>
    cols.map((c) => {
      const v = c.format ? c.format(row[c.key], row) : row[c.key]
      return escape(v)
    }).join(','),
  )
  const csv = '\ufeff' + [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
