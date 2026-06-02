import { useState, useEffect, useCallback, useRef } from 'react'
import { bannersService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

const MAX_VIDEO_MB = 50
const ACCEPT = 'image/*,video/mp4,video/webm'
const MIN_W = 1280
const MIN_H = 720
const REC_W = 1920
const REC_H = 1080

function checkImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file.type?.startsWith('image/')) {
      resolve({ ok: true })
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w < MIN_W || h < MIN_H) {
        resolve({ ok: false, msg: `Image trop petite (${w}×${h}). Minimum ${MIN_W}×${MIN_H}.` })
      } else if (w < REC_W || h < REC_H) {
        resolve({ ok: true, warn: `Recommandé : ${REC_W}×${REC_H} ou 3840×2160 (4K) pour un rendu net.` })
      } else {
        resolve({ ok: true })
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ ok: true })
    }
    img.src = url
  })
}

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '', titleEn: '', caption: '', captionEn: '', linkUrl: '', order: 0, active: true,
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const activeBanners = banners.filter((b) => b.active !== false)

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

  const resetForm = () => {
    setForm({ title: '', titleEn: '', caption: '', captionEn: '', linkUrl: '', order: 0, active: true })
    setFile(null)
    setPreview(null)
    setIsVideo(false)
    setEditing(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      title: b.title || '',
      titleEn: b.titleEn || '',
      caption: b.caption || '',
      captionEn: b.captionEn || '',
      linkUrl: b.linkUrl || '',
      order: b.order ?? 0,
      active: b.active !== false,
    })
    setPreview(b.thumbnailUrl || b.imageUrl || null)
    setIsVideo(b.mediaType === 'VIDEO')
    setFile(null)
  }

  const onPickFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const video = f.type?.startsWith('video/')
    if (video && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`La vidéo dépasse ${MAX_VIDEO_MB} Mo`)
      return
    }
    if (!video) {
      const dim = await checkImageDimensions(f)
      if (!dim.ok) {
        alert(dim.msg)
        return
      }
      if (dim.warn) alert(dim.warn)
    }
    setFile(f)
    setIsVideo(video)
    setPreview(URL.createObjectURL(f))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await bannersService.update(editing.id, {
          title: form.title,
          titleEn: form.titleEn,
          caption: form.caption,
          captionEn: form.captionEn,
          linkUrl: form.linkUrl,
          order: Number(form.order) || 0,
          active: form.active,
        })
        if (file) await bannersService.uploadImage(editing.id, file)
      } else {
        if (!file) {
          alert('Choisissez une image ou une vidéo')
          setSaving(false)
          return
        }
        await bannersService.createWithFile(file, {
          title: form.title,
          titleEn: form.titleEn,
          caption: form.caption,
          captionEn: form.captionEn,
          linkUrl: form.linkUrl,
          order: form.order,
          active: form.active,
        })
      }
      resetForm()
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

  const remove = async (id) => {
    if (!confirm('Supprimer cette bannière ?')) return
    await bannersService.delete(id)
    if (editing?.id === id) resetForm()
    load()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Bannières 16:9 — minimum {MIN_W}×{MIN_H} px, idéal 3840×2160 (4K). Les bannières actives ci-dessous sont affichées dans l&apos;app.
      </p>

      <h3 style={{ margin: '0 0 12px' }}>Bannières affichées dans l&apos;app ({activeBanners.length})</h3>
      {loading ? <Loading /> : activeBanners.length === 0 ? (
        <EmptyState title="Aucune bannière active" />
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
          {activeBanners.map((b) => (
            <BannerRow key={b.id} b={b} onEdit={() => openEdit(b)} onToggle={() => toggle(b)} onDelete={() => remove(b.id)} />
          ))}
        </div>
      )}

      <h3 style={{ margin: '0 0 12px' }}>{editing ? 'Modifier la bannière' : 'Ajouter une bannière'}</h3>
      <form onSubmit={save} className="card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input className="input" placeholder="Titre (FR)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Title (EN)" value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
          <input className="input" placeholder="Légende (FR)" value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
          <input className="input" placeholder="Caption (EN)" value={form.captionEn} onChange={(e) => setForm((f) => ({ ...f, captionEn: e.target.value }))} />
        </div>
        <input className="input" placeholder="Lien (optionnel)" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
        <input className="input" type="number" placeholder="Ordre" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />

        {preview && (
          isVideo ? (
            <video src={preview} controls muted style={{ width: '100%', maxHeight: 360, borderRadius: 8, background: '#000' }} />
          ) : (
            <img src={preview} alt="Aperçu" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, background: '#111' }} />
          )
        )}
        <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onPickFile} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          {editing ? 'Remplacer le média' : 'Choisir un média (image ou vidéo)'}
        </button>
        {file && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{file.name} {isVideo && '· VIDÉO'}</span>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Annuler</button>
          )}
        </div>
      </form>

      {banners.some((b) => b.active === false) && (
        <>
          <h3 style={{ margin: '28px 0 12px' }}>Bannières inactives</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {banners.filter((b) => b.active === false).map((b) => (
              <BannerRow key={b.id} b={b} onEdit={() => openEdit(b)} onToggle={() => toggle(b)} onDelete={() => remove(b.id)} dimmed />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BannerRow({ b, onEdit, onToggle, onDelete, dimmed }) {
  const isVid = b.mediaType === 'VIDEO'
  return (
    <div className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', opacity: dimmed ? 0.65 : 1 }}>
      <div style={{ position: 'relative', width: 160, height: 90, flexShrink: 0 }}>
        {b.imageUrl ? (
          <img src={b.thumbnailUrl || b.imageUrl} alt="" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 160, height: 90, background: 'var(--surface2)', borderRadius: 8 }} />
        )}
        {isVid && (
          <span style={{
            position: 'absolute', top: 4, left: 4, padding: '2px 6px',
            borderRadius: 4, background: '#E89B3C', color: '#fff',
            fontSize: 9, fontWeight: 700,
          }}>VIDÉO</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{b.title || 'Sans titre'}</div>
        {b.titleEn && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{b.titleEn}</div>}
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.caption}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ordre {b.order ?? 0}</div>
      </div>
      <button type="button" className="btn btn-sm" onClick={onEdit}>Modifier</button>
      <button type="button" className="btn btn-sm" onClick={onToggle}>{b.active ? 'Désactiver' : 'Activer'}</button>
      <button type="button" className="btn btn-sm" onClick={onDelete}>Supprimer</button>
    </div>
  )
}
