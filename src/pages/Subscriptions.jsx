import { useState, useCallback } from 'react'
import { subscriptionsService } from '../services/api'
import { Loading, PageHeader, StatusBadge } from '../components/UI'
import DataTable from '../components/DataTable'
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
    <div style={{ padding: '24px 28px 40px', maxWidth: 1200 }}>
      <PageHeader title="Souscriptions" subtitle="Suivi des investissements et statuts" />

      {loading ? <Loading /> : (
        <DataTable
          emptyMessage="Aucune souscription"
          columns={[
            { key: 'user', label: 'Investisseur', render: (s) => s.userName || '—' },
            { key: 'plan', label: 'Plan', render: (s) => s.planTitle || '—' },
            { key: 'amount', label: 'Montant', align: 'right', render: (s) => <strong>{formatXof(s.amountXof)}</strong> },
            { key: 'status', label: 'Statut', render: (s) => <StatusBadge status={s.status} /> },
            { key: 'date', label: 'Date', render: (s) => new Date(s.createdAt).toLocaleDateString('fr-FR') },
          ]}
          rows={items}
        />
      )}
    </div>
  )
}
