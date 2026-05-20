import { useState } from 'react'
import { PageHeader } from '../components/UI'

export default function Settings() {
  const [tab, setTab] = useState('profil')
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('taoman_admin_user') || '{}')
    } catch {
      return {}
    }
  })()

  return (
    <div style={{ padding: 28 }}>
      <PageHeader title="Paramètres" subtitle="Configuration TAOMAN Admin" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['profil', 'api'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
            {t === 'profil' ? 'Profil' : 'API'}
          </button>
        ))}
      </div>
      {tab === 'profil' && (
        <div className="card" style={{ padding: 20 }}>
          <p><strong>Nom :</strong> {user.name || '—'}</p>
          <p><strong>Email :</strong> {user.email || '—'}</p>
          <p><strong>Rôle :</strong> {user.role || '—'}</p>
        </div>
      )}
      {tab === 'api' && (
        <div className="card" style={{ padding: 20 }}>
          <p><strong>URL API :</strong> {import.meta.env.VITE_API_URL || 'http://localhost:3000/v1'}</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
            Version admin TAOMAN 1.0 — Back-office investissement UEMOA
          </p>
        </div>
      )}
    </div>
  )
}
