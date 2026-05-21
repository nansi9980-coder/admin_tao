import { useState, useEffect, useCallback, useRef } from 'react'
import { bannersService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', caption: '', linkUrl: '', order: 0 })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
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
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const create = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      alert('Choisissez une image depuis votre appareil')
      return
    }
    setSaving(true)
    try {
      await bannersService.createWithFile(imageFile, {
        title: form.title,
        caption: form.caption,
        linkUrl: form.linkUrl,
        order: form.order,
        active: true,
      })
      setForm({ title: '', caption: '', linkUrl: '', order: 0 })
      setImageFile(null)
      setPreview(null)
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

  const replaceImage = async (b, file) => {
    if (!file) return
    await bannersService.uploadImage(b.id, file)
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
          <img src={preview} alt="Aperçu" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          Choisir une image depuis l&apos;appareil
        </button>
        {imageFile && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{imageFile.name}</span>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Envoi…' : 'Ajouter'}
        </button>
      </form>

      {loading ? <Loading /> : banners.length === 0 ? <EmptyState title="Aucune bannière" /> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {banners.map(b => (
            <div key={b.id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              {b.imageUrl ? (
                <img src={b.imageUrl} alt="" style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 120, height: 60, background: 'var(--surface2)', borderRadius: 8 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{b.title || 'Sans titre'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.caption}</div>
              </div>
              <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer' }}>
                Remplacer image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => replaceImage(b, e.target.files?.[0])}
                />
              </label>
              <button className="btn btn-sm" onClick={() => toggle(b)}>{b.active ? 'Désactiver' : 'Activer'}</button>
              <button className="btn btn-sm" onClick={() => remove(b.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
