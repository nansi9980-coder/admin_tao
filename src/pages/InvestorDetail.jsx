import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { investorsService } from '../services/api'
import { TopBar, StatusBadge, Loading, EmptyState } from '../components/UI'

const formatXof = (v) => v != null ? new Intl.NumberFormat('fr-FR').format(Number(v) / 100) + ' FCFA' : '—'

export default function InvestorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('profil')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUser(await investorsService.getOne(id))
    } catch {
      setUser(null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading />
  if (!user) return <EmptyState title="Investisseur introuvable" />

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  return (
    <div style={{ padding: 28 }}>
      <button className="btn btn-sm" onClick={() => navigate('/investors')} style={{ marginBottom: 16 }}>← Retour</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800 }}>{name}</h1>
          <p style={{ color: 'var(--text2)' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge status={user.kycStatus} />
          <StatusBadge status={user.accountStatus} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['profil', 'kyc', 'wallet', 'subs'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
            {t === 'profil' ? 'Profil' : t === 'kyc' ? 'KYC' : t === 'wallet' ? 'Wallet' : 'Souscriptions'}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <div className="card" style={{ padding: 20 }}>
          <p><strong>Téléphone :</strong> {user.phone || '—'}</p>
          <p><strong>Pays :</strong> {user.country || '—'}</p>
          <p><strong>Inscrit le :</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : '—'}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {user.accountStatus !== 'SUSPENDED' && (
              <button className="btn btn-sm" onClick={async () => { await investorsService.suspend(user.id); load() }}>Suspendre</button>
            )}
            {user.accountStatus === 'SUSPENDED' && (
              <button className="btn btn-sm btn-primary" onClick={async () => { await investorsService.activate(user.id); load() }}>Activer</button>
            )}
            {user.kycStatus !== 'APPROVED' && (
              <button className="btn btn-sm btn-primary" onClick={async () => { await investorsService.approveKyc(user.id); load() }}>Approuver KYC</button>
            )}
          </div>
        </div>
      )}

      {tab === 'kyc' && (
        <div className="card" style={{ padding: 20 }}>
          {(user.documents || []).length === 0 ? <p>Aucun document</p> : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {(user.documents || []).map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 10 }}>{d.type}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td><a href={d.url} target="_blank" rel="noreferrer">Voir</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'wallet' && user.wallet && (
        <div className="card" style={{ padding: 20 }}>
          <p><strong>Solde :</strong> {formatXof(user.wallet.balanceXof)}</p>
          <p><strong>Bloqué :</strong> {formatXof(user.wallet.lockedXof)}</p>
        </div>
      )}

      {tab === 'subs' && (
        <div className="card" style={{ padding: 20 }}>
          {(user.subscriptions || []).length === 0 ? <p>Aucune souscription</p> : (
            (user.subscriptions || []).map(s => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                {s.plan?.title || s.planId} — {formatXof(s.amountXof)} — <StatusBadge status={s.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
