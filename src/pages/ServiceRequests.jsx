import { useState, useEffect, useCallback } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { Loading, EmptyState, Modal, StatusBadge } from '../components/UI'
import { serviceRequestsService, serviceSectorsService } from '../services/api'

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'CANCELLED']

const STATUS_LABELS = {
  PENDING: 'En attente',
  CONTACTED: 'Contacté',
  QUOTED: 'Devis envoyé',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [sectorFilter, setSectorFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (sectorFilter) params.sectorId = sectorFilter
      const res = await serviceRequestsService.getAll(params)
      setRequests(res?.items || [])
    } catch {
      setRequests([])
    }
    setLoading(false)
  }, [statusFilter, sectorFilter])

  useEffect(() => {
    serviceSectorsService.getAll().then(setSectors).catch(() => setSectors([]))
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = async (id) => {
    try {
      const detail = await serviceRequestsService.getOne(id)
      setSelected(detail)
      setAdminNotes(detail.adminNotes || '')
    } catch {
      alert('Impossible de charger la demande')
    }
  }

  const updateStatus = async (status) => {
    if (!selected) return
    setSaving(true)
    try {
      await serviceRequestsService.update(selected.id, { status, adminNotes })
      setSelected(null)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || 'Erreur')
    }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!confirm('Supprimer cette demande ?')) return
    await serviceRequestsService.delete(id)
    setSelected(null)
    load()
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'Tous' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>
      <select
        className="input"
        value={sectorFilter}
        onChange={(e) => setSectorFilter(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 280 }}
      >
        <option value="">Tous les secteurs</option>
        {sectors.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>

      {loading ? <Loading /> : requests.length === 0 ? (
        <EmptyState title="Aucune demande" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Date</th>
                <th style={{ padding: 12 }}>Client</th>
                <th style={{ padding: 12 }}>Secteur</th>
                <th style={{ padding: 12 }}>Offre</th>
                <th style={{ padding: 12 }}>Statut</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{new Date(r.createdAt).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{r.phone}</div>
                  </td>
                  <td style={{ padding: 12 }}>{r.sectorTitle}</td>
                  <td style={{ padding: 12 }}>{r.offerTitle || '—'}</td>
                  <td style={{ padding: 12 }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: 12 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => openDetail(r.id)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal title="Demande de devis" onClose={() => setSelected(null)}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <strong>{selected.sectorTitle}</strong>
            {selected.offerTitle && <> · {selected.offerTitle}</>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
            {selected.fullName} · {selected.phone}
            {selected.email && <> · {selected.email}</>}
          </div>
          {selected.preferredDate && (
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              Date souhaitée : {new Date(selected.preferredDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          {selected.location && (
            <div style={{ fontSize: 12, marginBottom: 8 }}>Lieu : {selected.location}</div>
          )}
          <div style={{
            padding: 12, background: 'var(--surface2)', borderRadius: 8,
            fontSize: 13, marginBottom: 16, whiteSpace: 'pre-wrap',
          }}>
            {selected.message}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Notes internes..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            style={{ width: '100%', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {['CONTACTED', 'QUOTED', 'CONFIRMED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                className="btn btn-sm"
                disabled={saving}
                onClick={() => updateStatus(st)}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" onClick={() => remove(selected.id)}>
            <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Supprimer
          </button>
        </Modal>
      )}
    </div>
  )
}
