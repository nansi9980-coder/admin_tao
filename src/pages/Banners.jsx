import { useState, useEffect, useCallback, useRef } from 'react'
import { bannersService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

const MAX_VIDEO_MB = 50
const ACCEPT = 'image/*,video/mp4,video/webm'

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', caption: '', linkUrl: '', order: 0 })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await bannersService.getAll()
      setBanners(Array.isArray(res) ? res : [])
    } catch {
      setBanners([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const onPickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const video = f.type?.startsWith('video/')
    if (video && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`La vidéo dépasse ${MAX_VIDEO_MB} Mo`)
      return
    }
    setFile(f)
    setIsVideo(video)
    setPreview(URL.createObjectURL(f))
  }

  const create = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Choisissez une image ou une vidéo depuis votre appareil')
      return
    }
    setSaving(true)
    try {
      await bannersService.createWithFile(file, {
        title: form.title,
        caption: form.caption,
        linkUrl: form.linkUrl,
        order: form.order,
        active: true,
      })
      setForm({ title: '', caption: '', linkUrl: '', order: 0 })
      setFile(null)
      setPreview(null)
      setIsVideo(false)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) {
      alert('Erreur: ' + (err?.response?.data?.message || err.message))
    }
    setSaving(false)
  }

  const toggle = async (b) => {
    await bannersService.update(b.id, { active: !b.active })
    load()
  }

  const replaceMedia = async (b, f) => {
    if (!f) return
    if (f.type?.startsWith('video/') && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`La vidéo dépasse ${MAX_VIDEO_MB} Mo`)
      return
    }
    await bannersService.uploadImage(b.id, f)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Supprimer cette bannière ?')) return
    await bannersService.delete(id)
    load()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <form onSubmit={create} className="card" style={{ padding: 20, marginBottom: 24, display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Nouvelle bannière</h3>
        <input className="input" placeholder="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="input" placeholder="Légende" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
        <input className="input" placeholder="Lien (optionnel)" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />

        {preview && (
          isVideo ? (
            <video src={preview} controls muted style={{ width: '100%', maxHeight: 220, borderRadius: 8, background: '#000' }} />
          ) : (
            <img src={preview} alt="Aperçu" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
          )
        )}
        <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          Choisir un média (image ou vidéo)
        </button>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          Formats acceptés : JPG, PNG, WebP, MP4, WebM. Vidéo ≤ {MAX_VIDEO_MB} Mo, durée recommandée 10-20 s.
        </span>
        {file && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{file.name} {isVideo && '· VIDÉO'}</span>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Envoi…' : 'Ajouter'}
        </button>
      </form>

      {loading ? <Loading /> : banners.length === 0 ? <EmptyState title="Aucune bannière" /> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {banners.map(b => {
            const isVid = b.mediaType === 'VIDEO'
            return (
              <div key={b.id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 120, height: 70, flexShrink: 0 }}>
                  {b.imageUrl ? (
                    <img src={b.thumbnailUrl || b.imageUrl} alt="" style={{ width: 120, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 120, height: 70, background: 'var(--surface2)', borderRadius: 8 }} />
                  )}
                  {isVid && (
                    <span style={{
                      position: 'absolute', top: 4, left: 4, padding: '2px 6px',
                      borderRadius: 4, background: '#E89B3C', color: '#fff',
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.6,
                    }}>VIDÉO</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.title || 'Sans titre'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.caption}</div>
                </div>
                <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer' }}>
                  Remplacer
                  <input
                    type="file"
                    accept={ACCEPT}
                    hidden
                    onChange={(e) => replaceMedia(b, e.target.files?.[0])}
                  />
                </label>
                <button className="btn btn-sm" onClick={() => toggle(b)}>{b.active ? 'Désactiver' : 'Activer'}</button>
                <button className="btn btn-sm" onClick={() => remove(b.id)}>Supprimer</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
