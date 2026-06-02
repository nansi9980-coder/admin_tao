import { useCallback, useEffect, useMemo, useState } from 'react'
import { mediaService } from '../services/api'
import { EmptyState, Loading } from '../components/UI'

export default function MediaLibrary() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [folder, setFolder] = useState('taoman/mediatek')
  const [tags, setTags] = useState('')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mediaService.getAll()
      setItems(Array.isArray(res) ? res : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await mediaService.upload(file, { folder, tags })
      await load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Upload échoué')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const onDelete = async (id) => {
    if (!confirm('Supprimer ce média ?')) return
    await mediaService.delete(id)
    await load()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) =>
      [it.url, it.folder, ...(it.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [items, query])

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <h3 style={{ marginTop: 0 }}>Mediatheque</h3>
      <p style={{ marginTop: 0, color: 'var(--text2)', fontSize: 13 }}>
        Uploadez vos images/videos ici puis reutilisez-les dans les formulaires (bannieres, CMS, etc.).
      </p>

      <div className="card" style={{ padding: 16, display: 'grid', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10 }}>
          <input className="input" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Dossier cloudinary" />
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (ex: banner,home)" />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un media" />
          <label className="btn btn-primary" style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {uploading ? 'Upload…' : 'Ajouter media'}
            <input type="file" accept="image/*,video/mp4,video/webm" onChange={onPickFile} hidden disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState title="Aucun media" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map((it) => {
            const isVideo = it.mediaType === 'VIDEO'
            return (
              <div key={it.id} className="card" style={{ padding: 10 }}>
                <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', background: '#0b1220' }}>
                  {isVideo ? (
                    <img src={it.thumbnailUrl || it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', wordBreak: 'break-all' }}>
                  {it.url}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard.writeText(it.url)}>Copier URL</button>
                  <button type="button" className="btn btn-sm" onClick={() => onDelete(it.id)}>Supprimer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
