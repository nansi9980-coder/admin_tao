import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Check, Pause, Plus, Copy, X, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { investorsService } from '../services/api'
import { SearchBar, StatusBadge, Loading, EmptyState, FilterTabs } from '../components/UI'
import BulkActionsBar from '../components/BulkActionsBar'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { exportToCsv } from '../utils/exportCsv'

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'CLOSED']
const KYC_FILTER_OPTIONS = ['ALL', 'IN_REVIEW', 'DOCUMENTS_RECEIVED', 'APPROVED', 'REJECTED']

export default function Investors() {
  const navigate = useNavigate()
  const [investors, setInvestors] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [kycFilter, setKycFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const [tempCreds, setTempCreds] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await investorsService.getAll({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(kycFilter !== 'ALL' && { kycStatus: kycFilter }),
        ...(search && { search }),
      })
      setInvestors(res?.items || [])
    } catch {
      setError('Erreur de chargement')
    }
    setLoading(false)
  }, [statusFilter, kycFilter, search])

  useRealtimeSync(load, { interval: 45000, debounceMs: 2000, topics: ['user', 'users'] })

  const toggleSuspend = async (u) => {
    try {
      if (u.accountStatus === 'SUSPENDED') await investorsService.activate(u.id)
      else await investorsService.suspend(u.id)
      load()
    } catch (e) {
      alert('Erreur: ' + (e?.response?.data?.message || e.message))
    }
  }

  const approveKyc = async (id) => {
    await investorsService.approveKyc(id)
    load()
  }

  const rejectKyc = async (id) => {
    const reason = prompt('Raison du rejet KYC:')
    if (!reason) return
    await investorsService.rejectKyc(id, reason)
    load()
  }

  const formatName = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email

  const createUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await investorsService.create(createForm)
      setTempCreds({ email: res.email, password: res.temporaryPassword })
      toast.success('Utilisateur créé')
      setShowCreate(false)
      setCreateForm({ firstName: '', lastName: '', email: '', phone: '' })
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  const toggleAll = () => {
    setSelected((s) => {
      if (s.size === investors.length) return new Set()
      return new Set(investors.map((u) => u.id))
    })
  }
  const clearSelection = () => setSelected(new Set())

  const exportCsv = () => {
    const rows = investors.filter((u) => selected.size === 0 || selected.has(u.id))
    const ok = exportToCsv('investors', rows, [
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'kycStatus', label: 'KYC' },
      { key: 'accountStatus', label: 'Statut' },
      { key: 'createdAt', label: 'Inscrit le', format: (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '' },
    ])
    if (ok) toast.success(`${rows.length} ligne(s) exportées`)
    else toast.error('Aucune donnée à exporter')
  }

  const bulkApproveKyc = async () => {
    const ids = Array.from(selected)
    await Promise.allSettled(ids.map((id) => investorsService.approveKyc(id)))
    toast.success(`KYC approuvée pour ${ids.length} investisseur(s)`)
    clearSelection()
    load()
  }
  const bulkSuspend = async () => {
    const ids = Array.from(selected)
    await Promise.allSettled(ids.map((id) => investorsService.suspend(id)))
    toast.success(`${ids.length} compte(s) suspendu(s)`)
    clearSelection()
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: '24px 28px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." />
        <FilterTabs options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        <FilterTabs options={KYC_FILTER_OPTIONS} value={kycFilter} onChange={setKycFilter} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Nouvel utilisateur
        </button>
        <button className="btn btn-sm" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> CSV
        </button>
      </div>

      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={createUser}
            className="card"
            style={{ padding: 24, maxWidth: 440, width: '100%', display: 'grid', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: 'Sora' }}>Nouvel utilisateur</h3>
              <button type="button" onClick={() => setShowCreate(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
                <X size={18} />
              </button>
            </div>
            <input className="input" placeholder="Prénom" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} required />
            <input className="input" placeholder="Nom" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} required />
            <input className="input" type="email" placeholder="Email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
            <input className="input" placeholder="Téléphone (optionnel)" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>
              Un mot de passe temporaire sera généré. L'utilisateur devra le changer à sa première connexion.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Création…' : 'Créer'}</button>
            </div>
          </form>
        </div>
      )}

      {tempCreds && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setTempCreds(null)}
        >
          <div className="card" style={{ padding: 24, maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <KeyRound size={20} color="#E89B3C" />
              <h3 style={{ margin: 0, fontFamily: 'Sora' }}>Identifiants temporaires</h3>
              <button onClick={() => setTempCreds(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text2)', margin: '0 0 14px', fontSize: 13 }}>
              Communiquez ces identifiants à <strong style={{ color: 'var(--text)' }}>{tempCreds.email}</strong> par un canal sécurisé.
            </p>
            <div style={{
              background: 'var(--surface-soft)', border: '1px dashed var(--border)', padding: '14px 16px',
              borderRadius: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text)',
              letterSpacing: 1.5, textAlign: 'center', wordBreak: 'break-all',
            }}>
              {tempCreds.password}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setTempCreds(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={async () => {
                try { await navigator.clipboard.writeText(tempCreds.password); toast.success('Copié') } catch { toast.error('Impossible de copier') }
              }}>
                <Copy size={14} /> Copier
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Loading /> : error ? <EmptyState title={error} /> : (
        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
                <th style={{ width: 32, padding: '10px 8px' }}>
                  <input
                    type="checkbox"
                    checked={selected.size === investors.length && investors.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>KYC</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Statut</th>
                <th style={{ textAlign: 'right', padding: '10px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: selected.has(u.id) ? 'rgba(43,95,245,0.04)' : 'transparent' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{formatName(u)}</td>
                  <td style={{ padding: '12px 8px' }}>{u.email}</td>
                  <td style={{ padding: '12px 8px' }}><StatusBadge status={u.kycStatus} /></td>
                  <td style={{ padding: '12px 8px' }}><StatusBadge status={u.accountStatus} /></td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/investors/${u.id}`)}>Voir</button>
                    {u.kycStatus !== 'APPROVED' && (
                      <button className="btn btn-sm btn-primary" onClick={() => approveKyc(u.id)}>Valider le compte</button>
                    )}
                    <button className="btn btn-sm" onClick={() => toggleSuspend(u)}>
                      {u.accountStatus === 'SUSPENDED' ? 'Activer' : 'Suspendre'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {investors.length === 0 && <EmptyState title="Aucun investisseur" />}
        </div>
      )}

      <BulkActionsBar
        count={selected.size}
        onClear={clearSelection}
        actions={[
          { label: 'Exporter CSV', icon: <Download size={14} />, onClick: exportCsv },
          { label: 'Valider le compte', icon: <Check size={14} />, color: '#10B981', onClick: bulkApproveKyc },
          { label: 'Suspendre', icon: <Pause size={14} />, danger: true, onClick: bulkSuspend },
        ]}
      />

    </div>
  )
}
