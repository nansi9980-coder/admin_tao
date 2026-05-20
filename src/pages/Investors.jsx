import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { investorsService } from '../services/api'
import { SearchBar, StatusBadge, Loading, EmptyState, FilterTabs } from '../components/UI'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'CLOSED']

export default function Investors() {
  const navigate = useNavigate()
  const [investors, setInvestors] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await investorsService.getAll({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(search && { search }),
      })
      setInvestors(res?.items || [])
    } catch {
      setError('Erreur de chargement')
    }
    setLoading(false)
  }, [statusFilter, search])

  useRealtimeSync(load, { interval: 5000, topics: ['user', 'users'] })

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

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div style={{ padding: '22px 28px', borderBottom: '1.5px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800 }}>Investisseurs</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Gestion des comptes investisseurs TAOMAN</p>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher..." />
        <FilterTabs options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? <Loading /> : error ? <EmptyState title={error} /> : (
        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>KYC</th>
                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Statut</th>
                <th style={{ textAlign: 'right', padding: '10px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{formatName(u)}</td>
                  <td style={{ padding: '12px 8px' }}>{u.email}</td>
                  <td style={{ padding: '12px 8px' }}><StatusBadge status={u.kycStatus} /></td>
                  <td style={{ padding: '12px 8px' }}><StatusBadge status={u.accountStatus} /></td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/investors/${u.id}`)}>Voir</button>
                    {u.kycStatus !== 'APPROVED' && (
                      <button className="btn btn-sm btn-primary" onClick={() => approveKyc(u.id)}>KYC ✓</button>
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

    </div>
  )
}
