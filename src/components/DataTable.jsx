import { EmptyState } from './UI'

/**
 * Tableau admin premium — colonnes: { key, label, align?, render?(row) }
 */
export default function DataTable({
  columns = [],
  rows = [],
  emptyMessage = 'Aucune donnée',
  onRowClick,
  compact = false,
}) {
  if (!rows.length) {
    return (
      <div className="table-wrap">
        <EmptyState message={emptyMessage} />
      </div>
    )
  }

  const pad = compact ? '10px 12px' : '13px 16px'

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: col.align || 'left', padding: pad }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left', padding: pad }}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
