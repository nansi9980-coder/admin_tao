import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Sélecteur visuel de médias (grille de miniatures).
 * @param {object} props
 * @param {Array} props.items - liste MediaAsset depuis mediaService.getAll()
 * @param {string} props.value - URL sélectionnée
 * @param {function} props.onChange - (url: string) => void
 * @param {boolean} [props.imagesOnly=true]
 */
export default function MediaPicker({ items = [], value, onChange, imagesOnly = true }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const list = imagesOnly ? items.filter((m) => m.mediaType === 'IMAGE') : items
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((m) =>
      [m.url, m.folder, ...(m.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [items, query, imagesOnly])

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Rechercher dans la médiathèque…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <Link to="/mediatek" className="btn btn-sm btn-ghost" target="_blank" rel="noreferrer">
          Gérer la médiathèque
        </Link>
      </div>

      {value && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img
            src={value}
            alt=""
            style={{
              width: 120,
              height: 68,
              objectFit: 'cover',
              borderRadius: 8,
              border: '2px solid #1E5BB8',
            }}
          />
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>
            Retirer la sélection
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
          Aucune image dans la médiathèque. Ajoutez-en depuis la page Médiathèque.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
            maxHeight: 220,
            overflowY: 'auto',
            padding: 4,
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          {filtered.map((m) => {
            const selected = value === m.url
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.url)}
                title={m.folder || 'media'}
                style={{
                  padding: 0,
                  border: selected ? '2px solid #1E5BB8' : '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#0b1220',
                  aspectRatio: '16 / 9',
                }}
              >
                <img
                  src={m.thumbnailUrl || m.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
