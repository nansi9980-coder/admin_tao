import { useState, useCallback } from 'react'
import { subscriptionsService } from '../services/api'
import { Loading, EmptyState, StatusBadge } from '../components/UI'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const formatXof = (v) => {
  if (!v) return '—'
  const n = Number(v) / 100
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function Subscriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await subscriptionsService.getAll()
      setItems(res?.items || [])
    } catch {
      setItems([])
    }
    setLoading(false)
  }, [])

  useRealtimeSync(load, { interval: 30000, topics: ['subscription'] })

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Souscriptions</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Suivi des investissements actifs</p>

      {loading ? <Loading /> : items.length === 0 ? <EmptyState title="Aucune souscription" /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
              <th style={{ textAlign: 'left', padding: 10 }}>Investisseur</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Plan</th>
              <th style={{ textAlign: 'right', padding: 10 }}>Montant</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Statut</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 12 }}>{s.userName || '—'}</td>
                <td style={{ padding: 12 }}>{s.planTitle || '—'}</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{formatXof(s.amountXof)}</td>
                <td style={{ padding: 12 }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: 12 }}>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
