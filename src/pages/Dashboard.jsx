import { useState, useEffect, useCallback } from 'react'
import { dashboardService, documentsService } from '../services/api'
import { StatCard, Loading } from '../components/UI'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const formatXof = (v) => {
  if (!v) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(Number(v) / 100) + ' FCFA'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pendingDocs, setPendingDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, docs] = await Promise.all([
        dashboardService.getStats(),
        documentsService.getAll('PENDING'),
      ])
      setStats(s)
      setPendingDocs(Array.isArray(docs) ? docs.slice(0, 5) : [])
    } catch {
      setStats(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useRealtimeSync(load, { interval: 5000, topics: ['dashboard', 'kyc'] })

  if (loading) return <Loading />

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tableau de bord</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>TAOMAN Group Investments — Vue d'ensemble</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Investisseurs" value={stats?.totalUsers ?? 0} />
        <StatCard label="Souscriptions actives" value={stats?.activeSubscriptions ?? 0} />
        <StatCard label="KYC en attente" value={stats?.pendingKyc ?? 0} accent="#E89B3C" />
        <StatCard label="Collecté total" value={formatXof(stats?.totalCollectedXof)} />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Documents KYC en attente</h3>
        {pendingDocs.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucun document en attente</p>
        ) : (
          pendingDocs.map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span>{d.submitterName || d.user?.email || '—'}</span>
              <span style={{ color: 'var(--text3)' }}>{d.type}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
