import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { cmsService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'
import { hasPerm } from '../utils/permissions'

const SECTION_LABELS = {
  services_hub: 'Page Services (hub)',
  service_detail: 'Page Détail Service',
  onboarding: 'Onboarding',
  home: 'Accueil utilisateur',
  carousel: 'Carrousel',
  help: 'Centre d’aide',
  guide: 'Guide d’utilisation',
  faq: 'FAQ globale',
  kyc: 'KYC',
  legal: 'Mentions légales',
}

const TYPE_LABELS = {
  SHORT_TEXT: 'Texte court',
  LONG_TEXT: 'Texte long',
  MARKDOWN: 'Markdown',
  LIST_ITEM: 'Élément de liste',
}

function sectionLabel(s) {
  return SECTION_LABELS[s] || s
}

export default function Cms({ role = 'READ_ONLY' }) {
  const canEdit = hasPerm(role, 'cms.write')
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // block in edit
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cmsService.listAll()
      const list = Array.isArray(res) ? res : []
      setBlocks(list)
      if (!activeSection && list.length) {
        setActiveSection(list[0].section)
      }
    } catch (e) {
      toast.error('Impossible de charger le CMS')
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }, [activeSection])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(() => {
    const map = new Map()
    blocks.forEach((b) => map.set(b.section, (map.get(b.section) || 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, c]) => ({ section: k, count: c }))
  }, [blocks])

  const filteredBlocks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return blocks
      .filter((b) => !activeSection || b.section === activeSection)
      .filter((b) => {
        if (!q) return true
        return (
          b.key.toLowerCase().includes(q) ||
          b.label.toLowerCase().includes(q) ||
          (b.value || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.order - b.order)
  }, [blocks, activeSection, search])

  // Groupement par parentKey (pour rendu en cluster)
  const grouped = useMemo(() => {
    const standalone = []
    const groups = new Map()
    filteredBlocks.forEach((b) => {
      if (b.parentKey) {
        if (!groups.has(b.parentKey)) groups.set(b.parentKey, [])
        groups.get(b.parentKey).push(b)
      } else {
        standalone.push(b)
      }
    })
    return { standalone, groups }
  }, [filteredBlocks])

  const handleSave = async (id, data) => {
    try {
      await cmsService.update(id, data)
      toast.success('Bloc mis à jour')
      setEditing(null)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (block) => {
    if (!confirm(`Supprimer "${block.label}" ?\n(${block.key})`)) return
    try {
      await cmsService.remove(block.id)
      toast.success('Bloc supprimé')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const handleCreate = async (data) => {
    try {
      await cmsService.create(data)
      toast.success('Bloc créé')
      setCreating(false)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleSeedDefaults = async () => {
    if (!confirm('Restaurer / compléter les blocs par défaut ?\nLes blocs existants ne sont pas écrasés.')) return
    setSeeding(true)
    try {
      const res = await cmsService.seedDefaults()
      toast.success(`Seed CMS terminé : ${res?.inserted || 0} ajoutés`)
      await load()
    } catch {
      toast.error('Échec du seed')
    } finally {
      setSeeding(false)
    }
  }

  if (loading) return <Loading text="Chargement du CMS..." />

  return (
    <div className="page-cms" style={{ padding: '1.25rem 1rem 3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Contenus de l’application</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
            Modifiez les textes, listes et images affichés dans l’application mobile.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (clé, label, texte)..."
            style={{
              padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
              minWidth: 260, background: 'var(--card)',
            }}
          />
          {canEdit && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleSeedDefaults}
                disabled={seeding}
                title="Restaurer les blocs par défaut"
              >
                {seeding ? '…' : 'Seed défaut'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setCreating(true)}
              >
                + Nouveau bloc
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 18, marginTop: 18 }}>
        {/* Onglets sections */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections.map((s) => {
              const active = activeSection === s.section
              return (
                <button
                  key={s.section}
                  onClick={() => setActiveSection(s.section)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: active ? 'var(--brand-50, #fff4e6)' : 'transparent',
                    color: active ? 'var(--brand-800, #b45309)' : 'inherit',
                    border: '1px solid',
                    borderColor: active ? 'var(--brand-200, #fcd34d)' : 'transparent',
                    borderRadius: 10,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <div>{sectionLabel(s.section)}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{s.count} bloc{s.count > 1 ? 's' : ''}</div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Liste des blocs de la section */}
        <main>
          {!filteredBlocks.length ? (
            <EmptyState message="Aucun bloc dans cette section." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped.standalone.map((b) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  canEdit={canEdit}
                  onEdit={() => setEditing(b)}
                  onDelete={() => handleDelete(b)}
                  childrenBlocks={grouped.groups.get(b.key)}
                  onEditChild={(c) => setEditing(c)}
                  onDeleteChild={handleDelete}
                />
              ))}
              {/* Groupes orphelins (sans parent dans la même section) */}
              {Array.from(grouped.groups.entries())
                .filter(([k]) => !grouped.standalone.find((b) => b.key === k))
                .map(([parentKey, items]) => (
                  <div key={parentKey} style={cardStyle}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{parentKey} (liste)</div>
                    {items.sort((a, b) => a.order - b.order).map((c) => (
                      <ChildItem
                        key={c.id}
                        block={c}
                        canEdit={canEdit}
                        onEdit={() => setEditing(c)}
                        onDelete={() => handleDelete(c)}
                      />
                    ))}
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {editing && (
          <EditModal
            block={editing}
            onClose={() => setEditing(null)}
            onSave={(data) => handleSave(editing.id, data)}
            onUploadImage={async (file) => {
              const updated = await cmsService.uploadImage(editing.id, file)
              setEditing(updated)
              await load()
            }}
            canEdit={canEdit}
          />
        )}
        {creating && (
          <EditModal
            block={null}
            defaultSection={activeSection}
            onClose={() => setCreating(false)}
            onSave={handleCreate}
            canEdit={canEdit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const cardStyle = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 14,
  background: 'var(--card)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
}

function BlockCard({ block, canEdit, onEdit, onDelete, childrenBlocks, onEditChild, onDeleteChild }) {
  const isParent = !!childrenBlocks && childrenBlocks.length > 0
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 6,
              background: 'var(--brand-50, #fff4e6)', color: 'var(--brand-800, #b45309)',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
            }}>
              {TYPE_LABELS[block.type] || block.type}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{block.key}</span>
            {!block.active && <span style={{ fontSize: 11, color: '#ef4444' }}>Inactif</span>}
          </div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{block.label}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {block.value?.length > 220 ? `${block.value.slice(0, 220)}…` : block.value}
          </div>
          {block.imageUrl && (
            <img src={block.imageUrl} alt="" style={{ maxWidth: 220, marginTop: 8, borderRadius: 8 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canEdit && (
            <>
              <button onClick={onEdit} className="btn btn-secondary">Modifier</button>
              <button onClick={onDelete} className="btn btn-ghost" style={{ color: '#ef4444' }}>Supp.</button>
            </>
          )}
        </div>
      </div>
      {isParent && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            Liste ({childrenBlocks.length} élément{childrenBlocks.length > 1 ? 's' : ''}) :
          </div>
          {childrenBlocks.sort((a, b) => a.order - b.order).map((c) => (
            <ChildItem key={c.id} block={c} canEdit={canEdit} onEdit={() => onEditChild(c)} onDelete={() => onDeleteChild(c)} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ChildItem({ block, canEdit, onEdit, onDelete }) {
  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 8,
      background: 'var(--bg, #fafafa)',
      marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{block.key}</div>
        <div style={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {block.value?.length > 160 ? `${block.value.slice(0, 160)}…` : block.value}
        </div>
        {block.metadata && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>
            {Object.entries(block.metadata).map(([k, v]) => (
              <span key={k} style={{ marginRight: 8 }}>{k}: {String(v)}</span>
            ))}
          </div>
        )}
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onEdit} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>Éditer</button>
          <button onClick={onDelete} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}>×</button>
        </div>
      )}
    </div>
  )
}

function EditModal({ block, defaultSection, onClose, onSave, onUploadImage, canEdit }) {
  const [form, setForm] = useState(() => ({
    section: block?.section || defaultSection || '',
    key: block?.key || '',
    label: block?.label || '',
    type: block?.type || 'SHORT_TEXT',
    value: block?.value || '',
    parentKey: block?.parentKey || '',
    order: block?.order ?? 0,
    active: block?.active ?? true,
    metadata: block?.metadata ? JSON.stringify(block.metadata, null, 2) : '',
  }))
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const submit = async () => {
    if (!canEdit) return
    setSaving(true)
    let parsedMeta = undefined
    if (form.metadata?.trim()) {
      try {
        parsedMeta = JSON.parse(form.metadata)
      } catch {
        toast.error('Métadonnées : JSON invalide')
        setSaving(false)
        return
      }
    }
    const payload = block
      ? {
          label: form.label,
          type: form.type,
          value: form.value,
          parentKey: form.parentKey || null,
          order: Number(form.order) || 0,
          active: form.active,
          metadata: parsedMeta ?? null,
        }
      : {
          section: form.section,
          key: form.key,
          label: form.label,
          type: form.type,
          value: form.value,
          parentKey: form.parentKey || undefined,
          order: Number(form.order) || 0,
          active: form.active,
          metadata: parsedMeta,
        }
    await onSave(payload)
    setSaving(false)
  }

  const pickImage = async (e) => {
    const f = e.target.files?.[0]
    if (!f || !onUploadImage) return
    setUploading(true)
    try {
      await onUploadImage(f)
      toast.success('Image envoyée')
    } catch {
      toast.error('Upload échoué')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 14, maxWidth: 720, width: '100%',
          maxHeight: '88vh', overflow: 'auto', padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{block ? 'Modifier le bloc' : 'Nouveau bloc'}</h2>
          <button onClick={onClose} className="btn btn-ghost">×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Section" disabled={!!block}>
            <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} disabled={!!block} />
          </Field>
          <Field label="Clé unique" disabled={!!block}>
            <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} disabled={!!block} />
          </Field>
          <Field label="Label (affiché à l’admin)">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Parent key (optionnel)">
            <input value={form.parentKey} onChange={(e) => setForm({ ...form, parentKey: e.target.value })} placeholder="ex: services_hub.faq.list" />
          </Field>
          <Field label="Ordre">
            <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </Field>
        </div>

        <Field label="Valeur (texte affiché)">
          <textarea
            rows={form.type === 'SHORT_TEXT' ? 2 : 6}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
        </Field>

        <Field label="Métadonnées (JSON, optionnel) — ex: {&quot;icon&quot;:&quot;bolt&quot;,&quot;question&quot;:&quot;...&quot;}">
          <textarea
            rows={4}
            value={form.metadata}
            onChange={(e) => setForm({ ...form, metadata: e.target.value })}
            placeholder='{"icon":"bolt","title":"Réactivité"}'
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Field>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Bloc actif (visible dans l’application)
        </label>

        {block && (
          <div style={{ marginTop: 14, padding: 12, border: '1px dashed var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Image illustrative</div>
            {block.imageUrl && <img src={block.imageUrl} alt="" style={{ maxWidth: 220, borderRadius: 8, marginBottom: 8 }} />}
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} disabled={uploading || !canEdit} />
            {uploading && <span style={{ marginLeft: 8 }}>Envoi…</span>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} className="btn btn-ghost">Annuler</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving || !canEdit}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Field({ label, disabled, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, opacity: disabled ? 0.7 : 1 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      {children}
    </label>
  )
}
