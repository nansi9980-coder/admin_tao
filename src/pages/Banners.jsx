import { useState, useEffect, useCallback } from 'react'
import { bannersService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', caption: '', imageUrl: '', linkUrl: '', order: 0, active: true })

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

  const create = async (e) => {
    e.preventDefault()
    await bannersService.create(form)
    setForm({ title: '', caption: '', imageUrl: '', linkUrl: '', order: 0, active: true })
    load()
  }

  const toggle = async (b) => {
    await bannersService.update(b.id, { active: !b.active })
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
        <input className="input" placeholder="URL image" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} required />
        <input className="input" placeholder="Lien (optionnel)" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>

      {loading ? <Loading /> : banners.length === 0 ? <EmptyState title="Aucune bannière" /> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {banners.map(b => (
            <div key={b.id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{b.title || 'Sans titre'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.caption}</div>
              </div>
              <button className="btn btn-sm" onClick={() => toggle(b)}>{b.active ? 'Désactiver' : 'Activer'}</button>
              <button className="btn btn-sm" onClick={() => remove(b.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
