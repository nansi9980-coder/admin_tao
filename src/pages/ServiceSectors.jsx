import { useState, useEffect, useCallback, useRef } from 'react'
import { serviceSectorsService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

export default function ServiceSectors() {
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [offerForm, setOfferForm] = useState({ title: '', description: '' })
  const fileRef = useRef(null)
  const [uploadSectorId, setUploadSectorId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await serviceSectorsService.getAll()
      setSectors(Array.isArray(res) ? res : [])
    } catch {
      setSectors([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (sector) => {
    await serviceSectorsService.update(sector.id, { active: !sector.active })
    load()
  }

  const addOffer = async (sectorId) => {
    if (!offerForm.title.trim()) return
    await serviceSectorsService.createOffer(sectorId, offerForm)
    setOfferForm({ title: '', description: '' })
    load()
  }

  const deleteOffer = async (offerId) => {
    if (!confirm('Supprimer cette offre ?')) return
    await serviceSectorsService.deleteOffer(offerId)
    load()
  }

  const onHeroFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadSectorId) return
    await serviceSectorsService.uploadHero(uploadSectorId, file)
    setUploadSectorId(null)
    if (fileRef.current) fileRef.current.value = ''
    load()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onHeroFile} />

      {loading ? <Loading /> : sectors.length === 0 ? (
        <EmptyState title="Aucun secteur — lancez le seed backend" />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {sectors.map((s) => (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                  {s.heroImageUrl && (
                    <img src={s.heroImageUrl} alt="" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.slug} · {s.requestCount} demande(s)</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.description}</div>
                    {s.phone && <div style={{ fontSize: 12, marginTop: 4 }}>Tél. {s.phone}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                    Image hero
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    Offres ({s.offers?.length || 0})
                  </button>
                </div>
              </div>

              {expanded === s.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  {(s.offers || []).map((o) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <div>
                        <strong>{o.title}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{o.description}</div>
                      </div>
                      <button className="btn btn-sm" onClick={() => deleteOffer(o.id)}>Supprimer</button>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                    <input
                      className="input"
                      placeholder="Titre offre"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="Description"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
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
  )
}
