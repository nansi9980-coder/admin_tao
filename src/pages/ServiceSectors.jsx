import { useState, useEffect, useCallback, useRef } from 'react'
import { mediaService, serviceSectorsService, publicServiceSectorsPreview } from '../services/api'
import { Loading, EmptyState } from '../components/UI'
import MediaPicker from '../components/MediaPicker'
import { compressImageForUpload, formatFileSize } from '../utils/compressImage'

const EMPTY_SECTOR = {
  slug: '',
  title: '',
  description: '',
  iconKey: 'btp',
  phone: '',
  sortOrder: 0,
}

export default function ServiceSectors() {
  const [sectors, setSectors] = useState([])
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [offerForms, setOfferForms] = useState({})
  const [editSector, setEditSector] = useState(null)
  const [newSector, setNewSector] = useState(null)
  const [editOffer, setEditOffer] = useState(null)
  const fileRef = useRef(null)
  const [uploadSectorId, setUploadSectorId] = useState(null)
  const [media, setMedia] = useState([])
  const [pickingMediaForSectorId, setPickingMediaForSectorId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, med] = await Promise.all([
        serviceSectorsService.getAll(),
        mediaService.getAll().catch(() => []),
      ])
      setSectors(Array.isArray(res) ? res : [])
      setMedia(Array.isArray(med) ? med : [])
    } catch {
      setSectors([])
      setMedia([])
    }
    setLoading(false)
  }, [])

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const data = await publicServiceSectorsPreview()
      setPreview(Array.isArray(data) ? data : [])
    } catch {
      setPreview([])
    }
    setPreviewLoading(false)
  }, [])

  useEffect(() => {
    load()
    loadPreview()
  }, [load, loadPreview])

  const getOfferForm = (sectorId) =>
    offerForms[sectorId] || { title: '', description: '' }

  const setOfferFormField = (sectorId, field, value) => {
    setOfferForms((prev) => ({
      ...prev,
      [sectorId]: { ...getOfferForm(sectorId), [field]: value },
    }))
  }

  const toggleActive = async (sector) => {
    await serviceSectorsService.update(sector.id, { active: !sector.active })
    load()
    loadPreview()
  }

  const saveSector = async () => {
    if (!editSector) return
    await serviceSectorsService.update(editSector.id, {
      title: editSector.title,
      description: editSector.description,
      iconKey: editSector.iconKey,
      phone: editSector.phone || null,
      sortOrder: Number(editSector.sortOrder) || 0,
    })
    setEditSector(null)
    load()
    loadPreview()
  }

  const createSector = async () => {
    if (!newSector?.slug?.trim() || !newSector?.title?.trim()) {
      alert('Slug et titre requis')
      return
    }
    await serviceSectorsService.create(newSector)
    setNewSector(null)
    load()
    loadPreview()
  }

  const deleteSector = async (sector) => {
    if (!confirm(`Supprimer le secteur « ${sector.title} » et toutes ses offres ?`)) return
    await serviceSectorsService.delete(sector.id)
    load()
    loadPreview()
  }

  const addOffer = async (sectorId) => {
    const form = getOfferForm(sectorId)
    if (!form.title.trim()) return
    await serviceSectorsService.createOffer(sectorId, form)
    setOfferForms((prev) => ({ ...prev, [sectorId]: { title: '', description: '' } }))
    load()
    loadPreview()
  }

  const saveOffer = async () => {
    if (!editOffer) return
    await serviceSectorsService.updateOffer(editOffer.id, {
      title: editOffer.title,
      description: editOffer.description,
    })
    setEditOffer(null)
    load()
    loadPreview()
  }

  const deleteOffer = async (offerId) => {
    if (!confirm('Supprimer cette offre ?')) return
    await serviceSectorsService.deleteOffer(offerId)
    load()
    loadPreview()
  }

  const onHeroFile = async (e) => {
    const raw = e.target.files?.[0]
    if (!raw || !uploadSectorId) return
    const sectorId = uploadSectorId
    try {
      const file = await compressImageForUpload(raw)
      if (file.size !== raw.size) {
        console.info(
          `[hero] ${formatFileSize(raw.size)} → ${formatFileSize(file.size)}`,
        )
      }
      await serviceSectorsService.uploadHero(sectorId, file)
      load()
      loadPreview()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Échec de l\'envoi de l\'image'
      alert(msg)
    } finally {
      setUploadSectorId(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const applyMediaImage = async (sectorId, imageUrl) => {
    if (!sectorId || !imageUrl) return
    await serviceSectorsService.update(sectorId, { heroImageUrl: imageUrl })
    load()
    loadPreview()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onHeroFile} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', maxWidth: 520 }}>
          Gérez les secteurs affichés dans l&apos;app (partie Services). L&apos;aperçu à droite montre
          exactement ce que voient les clients via l&apos;API publique.
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => setNewSector({ ...EMPTY_SECTOR })}>
          + Nouveau secteur
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          {loading ? <Loading /> : sectors.length === 0 ? (
            <EmptyState title="Aucun secteur — lancez le seed backend" />
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {sectors.map((s) => (
                <div key={s.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                      {s.heroImageUrl ? (
                        <img src={s.heroImageUrl} alt="" style={{ width: 100, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 100, height: 72, background: 'var(--surface2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)' }}>
                          Pas d&apos;image
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.slug} · {s.requestCount} demande(s) · {s.active ? 'Actif' : 'Inactif'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.description}</div>
                        {s.phone && <div style={{ fontSize: 12, marginTop: 4 }}>Tél. {s.phone}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditSector({ ...s })}>Modifier</button>
                      <button className="btn btn-sm" onClick={() => toggleActive(s)}>
                        {s.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setUploadSectorId(s.id)
                          fileRef.current?.click()
                        }}
                      >
                        Image
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPickingMediaForSectorId(s.id)}
                      >
                        Médiathèque
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        Offres ({s.offers?.length || 0})
                      </button>
                      <button className="btn btn-sm" onClick={() => deleteSector(s)}>Supprimer</button>
                    </div>
                  </div>

                  {expanded === s.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      {(s.offers || []).map((o) => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', gap: 8 }}>
                          <div>
                            <strong>{o.title}</strong>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{o.description}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditOffer({ ...o })}>Modifier</button>
                            <button className="btn btn-sm" onClick={() => deleteOffer(o.id)}>Supprimer</button>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                        <input
                          className="input"
                          placeholder="Titre nouvelle offre"
                          value={getOfferForm(s.id).title}
                          onChange={(e) => setOfferFormField(s.id, 'title', e.target.value)}
                        />
                        <input
                          className="input"
                          placeholder="Description"
                          value={getOfferForm(s.id).description}
                          onChange={(e) => setOfferFormField(s.id, 'description', e.target.value)}
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => addOffer(s.id)}>Ajouter offre</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16, position: 'sticky', top: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Aperçu app mobile</strong>
            <button className="btn btn-sm btn-ghost" onClick={loadPreview} disabled={previewLoading}>
              {previewLoading ? '…' : 'Actualiser'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
            Données de GET /public/service-sectors (secteurs actifs uniquement)
          </p>
          {previewLoading ? <Loading /> : preview.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Aucun secteur actif visible dans l&apos;app.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {preview.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 10,
                    background: '#FAFAF7',
                    textAlign: 'center',
                  }}
                >
                  {s.heroImageUrl && (
                    <img src={s.heroImageUrl} alt="" style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
                  )}
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.offers?.length || 0} offre(s)</div>
                </div>
              ))}
              <div style={{ border: '1.5px solid #E89B3C', borderRadius: 10, padding: 10, background: '#FDF1DF', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Investments</div>
                <div style={{ fontSize: 10, color: '#CC7E1F' }}>Fixe dans l&apos;app</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pickingMediaForSectorId && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110,
          }}
          onClick={() => setPickingMediaForSectorId(null)}
        >
          <div
            className="card"
            style={{ padding: 20, width: '92%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Choisir une image</h3>
            <MediaPicker
              items={media}
              value=""
              onChange={(url) => {
                if (url) {
                  applyMediaImage(pickingMediaForSectorId, url)
                  setPickingMediaForSectorId(null)
                }
              }}
            />
            <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setPickingMediaForSectorId(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {editSector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditSector(null)}>
          <div className="card" style={{ padding: 24, width: '92%', maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Modifier le secteur</h3>
            <label style={{ display: 'block', marginBottom: 8 }}>Titre<input className="input" style={{ width: '100%', marginTop: 4 }} value={editSector.title} onChange={(e) => setEditSector({ ...editSector, title: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Description<textarea className="input" rows={2} style={{ width: '100%', marginTop: 4 }} value={editSector.description || ''} onChange={(e) => setEditSector({ ...editSector, description: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Téléphone<input className="input" style={{ width: '100%', marginTop: 4 }} value={editSector.phone || ''} onChange={(e) => setEditSector({ ...editSector, phone: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Icone (clé)<input className="input" style={{ width: '100%', marginTop: 4 }} value={editSector.iconKey || ''} onChange={(e) => setEditSector({ ...editSector, iconKey: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 16 }}>Ordre<input type="number" className="input" style={{ width: '100%', marginTop: 4 }} value={editSector.sortOrder} onChange={(e) => setEditSector({ ...editSector, sortOrder: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditSector(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveSector}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {newSector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setNewSector(null)}>
          <div className="card" style={{ padding: 24, width: '92%', maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouveau secteur</h3>
            <label style={{ display: 'block', marginBottom: 8 }}>Slug (ex. lavage-auto)<input className="input" style={{ width: '100%', marginTop: 4 }} value={newSector.slug} onChange={(e) => setNewSector({ ...newSector, slug: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Titre<input className="input" style={{ width: '100%', marginTop: 4 }} value={newSector.title} onChange={(e) => setNewSector({ ...newSector, title: e.target.value })} /></label>
            <label style={{ display: 'block', marginBottom: 16 }}>Description<textarea className="input" rows={2} style={{ width: '100%', marginTop: 4 }} value={newSector.description} onChange={(e) => setNewSector({ ...newSector, description: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setNewSector(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={createSector}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {editOffer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditOffer(null)}>
          <div className="card" style={{ padding: 24, width: '92%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Modifier l&apos;offre</h3>
            <input className="input" placeholder="Titre" value={editOffer.title} onChange={(e) => setEditOffer({ ...editOffer, title: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
            <textarea className="input" rows={2} placeholder="Description" value={editOffer.description || ''} onChange={(e) => setEditOffer({ ...editOffer, description: e.target.value })} style={{ width: '100%', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditOffer(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveOffer}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
