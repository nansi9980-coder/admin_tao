import { useState, useCallback } from 'react'
import { financeService } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard, Loading } from '../components/UI'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const formatXof = (v) => {
  if (!v) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(Number(v) / 100) + ' FCFA'
}

export default function Finance() {
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState([])
  const [transactions, setTransactions] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c, t, p] = await Promise.all([
        financeService.getStats(),
        financeService.getChart('weekly'),
        financeService.getTransactions(1, 20),
        financeService.getPendingDeposits(),
      ])
      setStats(s)
      setChart((c || []).map((d) => ({
        ...d,
        deposits: Number(d.deposits) / 100,
        withdrawals: Number(d.withdrawals) / 100,
      })))
      setTransactions(t?.items || [])
      setPending(Array.isArray(p) ? p : [])
    } catch {
      setStats(null)
    }
    setLoading(false)
  }, [])

  useRealtimeSync(load, { interval: 45000, debounceMs: 2000, topics: ['transaction', 'finance'] })

  const confirmTx = async (id) => {
    await financeService.confirmTransaction(id)
    load()
  }

  const rejectTx = async (id) => {
    const reason = prompt('Motif du rejet:')
    if (!reason) return
    await financeService.rejectTransaction(id, reason)
    load()
  }

  if (loading) return <Loading />

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      {pending.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24, border: '1.5px solid #E89B3C' }}>
          <h3 style={{ marginBottom: 12 }}>Transactions en attente ({pending.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
                <th style={{ textAlign: 'left', padding: 10 }}>Type</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Utilisateur</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Réf.</th>
                <th style={{ textAlign: 'right', padding: 10 }}>Montant</th>
                <th style={{ textAlign: 'right', padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{t.type}</td>
                  <td style={{ padding: 12 }}>{t.userEmail || t.userId}</td>
                  <td style={{ padding: 12 }}>{t.providerRef || '—'}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{formatXof(t.amountXof)}</td>
                  <td style={{ padding: 12, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => confirmTx(t.id)}>Confirmer</button>
                    <button className="btn btn-sm" onClick={() => rejectTx(t.id)}>Rejeter</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Dépôts totaux" value={formatXof(stats?.totalDepositsXof)} />
        <StatCard label="Retraits totaux" value={formatXof(stats?.totalWithdrawalsXof)} />
        <StatCard label="Souscriptions" value={formatXof(stats?.totalSubscriptionsXof)} />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 28, height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="deposits" stroke="#1E5BB8" fill="rgba(30,91,184,0.1)" name="Dépôts" />
            <Area type="monotone" dataKey="withdrawals" stroke="#E89B3C" fill="rgba(232,155,60,0.1)" name="Retraits" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ marginBottom: 12 }}>Transactions récentes</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>Type</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Utilisateur</th>
            <th style={{ textAlign: 'right', padding: 10 }}>Montant</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Statut</th>
            <th style={{ textAlign: 'right', padding: 10 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: 12 }}>{t.type}</td>
              <td style={{ padding: 12 }}>{t.userEmail}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{formatXof(t.amountXof)}</td>
              <td style={{ padding: 12 }}>{t.status}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                {t.status === 'PENDING' && (t.type === 'DEPOSIT' || t.type === 'WITHDRAWAL') && (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => confirmTx(t.id)}>Confirmer</button>
                    <button className="btn btn-sm" style={{ marginLeft: 6 }} onClick={() => rejectTx(t.id)}>Rejeter</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
