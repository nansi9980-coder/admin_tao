import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Settings() {
  const [tab, setTab] = useState('profil')
  const [theme, setTheme] = useState(() => localStorage.getItem('taoman_admin_theme') || 'light')
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('taoman_admin_user') || '{}')
    } catch {
      return {}
    }
  })()

  const applyTheme = (next) => {
    setTheme(next)
    localStorage.setItem('taoman_admin_theme', next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    toast.success(next === 'dark' ? 'Thème sombre activé' : 'Thème clair activé')
  }

  const copyApiUrl = async () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1'
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL API copiée')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Paramètres</h1>
      <p style={{ margin: '0 0 20px', color: 'var(--text2)', fontSize: 14 }}>
        Profil administrateur et configuration locale
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['profil', 'apparence', 'api'].map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'profil' ? 'Profil' : t === 'apparence' ? 'Apparence' : 'API'}
          </button>
        ))}
      </div>
      {tab === 'profil' && (
        <div className="card" style={{ padding: 20, maxWidth: 520 }}>
          <p><strong>Nom :</strong> {user.name || '—'}</p>
          <p><strong>Email :</strong> {user.email || '—'}</p>
          <p><strong>Rôle :</strong> {user.role || '—'}</p>
        </div>
      )}
      {tab === 'apparence' && (
        <div className="card" style={{ padding: 20, maxWidth: 520 }}>
          <p style={{ marginBottom: 12 }}>Thème de l&apos;interface</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
              onClick={() => applyTheme('light')}
            >
              Clair
            </button>
            <button
              className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
              onClick={() => applyTheme('dark')}
            >
              Sombre
            </button>
          </div>
        </div>
      )}
      {tab === 'api' && (
        <div className="card" style={{ padding: 20, maxWidth: 520 }}>
          <p><strong>URL API :</strong> {import.meta.env.VITE_API_URL || 'http://localhost:3000/v1'}</p>
          <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={copyApiUrl}>
            Copier l&apos;URL
          </button>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12 }}>
            Version admin TAOMAN 1.0 — Back-office investissement UEMOA
          </p>
        </div>
      )}
    </div>
  )
}
