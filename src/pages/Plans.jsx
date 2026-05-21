import { useState, useCallback, useEffect, useRef } from 'react'
import { plansService } from '../services/api'
import { Loading, EmptyState, StatusBadge } from '../components/UI'

const formatXof = (v) => v ? new Intl.NumberFormat('fr-FR').format(Number(v) / 100) + ' FCFA' : '—'
const toCentimes = (fcfa) => String(Math.round(Number(fcfa) * 100))

const EMPTY_FORM = {
  title: '',
  sector: 'BTP',
  description: '',
  annualRatePct: '12',
  durationMonths: '12',
  minAmountFcfa: '',
  capacityFcfa: '',
  riskLevel: 'MEDIUM',
  status: 'DRAFT',
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [heroFile, setHeroFile] = useState(null)
  const [heroPreview, setHeroPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await plansService.getAll()
      setPlans(Array.isArray(res) ? res : [])
    } catch {
      setPlans([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setHeroFile(null)
    setHeroPreview(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (plan) => {
    setForm({
      title: plan.title || '',
      sector: plan.sector || 'BTP',
      description: plan.description || '',
      annualRatePct: String(plan.annualRatePct ?? ''),
      durationMonths: String(plan.durationMonths ?? ''),
      minAmountFcfa: plan.minAmountXof ? String(Number(plan.minAmountXof) / 100) : '',
      capacityFcfa: plan.capacityXof ? String(Number(plan.capacityXof) / 100) : '',
      riskLevel: plan.riskLevel || 'MEDIUM',
      status: plan.status || 'DRAFT',
    })
    setHeroFile(null)
    setHeroPreview(plan.heroImageUrl || null)
    setModal({ mode: 'edit', plan })
  }

  const closeModal = () => {
    setModal(null)
    setHeroFile(null)
    setHeroPreview(null)
  }

  const onPickHero = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroFile(file)
    setHeroPreview(URL.createObjectURL(file))
  }

  const payloadFromForm = () => ({
    title: form.title,
    sector: form.sector,
    description: form.description,
    annualRatePct: Number(form.annualRatePct),
    durationMonths: Number(form.durationMonths),
    minAmountXof: toCentimes(form.minAmountFcfa),
    capacityXof: toCentimes(form.capacityFcfa),
    riskLevel: form.riskLevel,
    status: form.status,
  })

  const savePlan = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        const created = await plansService.create(payloadFromForm())
        if (heroFile && created?.id) {
          await plansService.uploadHero(created.id, heroFile)
        }
      } else if (modal.plan?.id) {
        await plansService.update(modal.plan.id, payloadFromForm())
        if (heroFile) {
          await plansService.uploadHero(modal.plan.id, heroFile)
        }
      }
      closeModal()
      load()
    } catch (err) {
      alert('Erreur: ' + (err?.response?.data?.message || err.message))
    }
    setSaving(false)
  }

  const toggleOpen = async (plan) => {
    const newStatus = plan.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    await plansService.update(plan.id, { status: newStatus })
    load()
  }

  const deletePlan = async (plan) => {
    if (plan.status !== 'DRAFT') return alert('Seuls les plans brouillon peuvent être supprimés')
    if (!confirm(`Supprimer « ${plan.title} » ?`)) return
    await plansService.delete(plan.id)
    load()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau plan</button>
      </div>

      {loading ? <Loading /> : plans.length === 0 ? <EmptyState title="Aucun plan" /> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {plans.map((p) => (
            <div key={p.id} className="card" style={{ padding: 0, display: 'flex', overflow: 'hidden' }}>
              {p.heroImageUrl ? (
                <img src={p.heroImageUrl} alt="" style={{ width: 140, minHeight: 120, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 140, minHeight: 120, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 11, flexShrink: 0 }}>
                  Pas d&apos;image
                </div>
              )}
              <div style={{ flex: 1, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {p.sector} · {p.annualRatePct}% / an · Min {formatXof(p.minAmountXof)}
                  </div>
                  <div style={{ marginTop: 8 }}><StatusBadge status={p.status} /></div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 13 }}>
                    {formatXof(p.collectedXof)} / {formatXof(p.capacityXof)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(p)}>Modifier</button>
                    {p.status === 'DRAFT' && (
                      <button className="btn btn-sm" onClick={() => deletePlan(p)}>Supprimer</button>
                    )}
                    <button className="btn btn-sm btn-primary" onClick={() => toggleOpen(p)}>
                      {p.status === 'OPEN' ? 'Fermer' : 'Ouvrir'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={closeModal}>
          <form className="card" style={{ padding: 28, maxWidth: 560, width: '92%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} onSubmit={savePlan}>
            <h3 style={{ marginBottom: 16 }}>{modal.mode === 'create' ? 'Nouveau plan' : 'Modifier le plan'}</h3>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Image du projet</span>
              {heroPreview && (
                <img src={heroPreview} alt="Aperçu" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginTop: 8, marginBottom: 8 }} />
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickHero} />
              <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
                Choisir une image depuis l&apos;appareil
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Titre</span>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Secteur</span>
              <select className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} style={{ width: '100%', marginTop: 4 }}>
                {['BTP', 'AGRO', 'TRANSPORT', 'COMMERCE'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Description</span>
              <textarea className="input" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Taux annuel (%)</span>
                <input type="number" className="input" required value={form.annualRatePct} onChange={(e) => setForm({ ...form, annualRatePct: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
              </label>
              <label>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Durée (mois)</span>
                <input type="number" className="input" required value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
              </label>
              <label>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Min (FCFA)</span>
                <input type="number" className="input" required value={form.minAmountFcfa} onChange={(e) => setForm({ ...form, minAmountFcfa: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
              </label>
              <label>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Capacité (FCFA)</span>
                <input type="number" className="input" required value={form.capacityFcfa} onChange={(e) => setForm({ ...form, capacityFcfa: e.target.value })} style={{ width: '100%', marginTop: 4 }} />
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Statut</span>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: '100%', marginTop: 4 }}>
                {['DRAFT', 'OPEN', 'CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={closeModal}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
