import { useState } from 'react'
import { authService, API_BASE } from '../services/api'
import logoPng from '../assets/logo.png'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(localStorage.getItem('taoman_admin_email') || '')
  const [password, setPassword] = useState('')
  const [code2fa, setCode2fa] = useState('')
  const [tempToken, setTempToken] = useState(null)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const finishLogin = (data) => {
    const token = data.accessToken
    if (!token) {
      setError('Erreur serveur : aucun token reçu.')
      return
    }
    localStorage.setItem('taoman_admin_token', token)
    if (remember) localStorage.setItem('taoman_admin_email', email)
    else localStorage.removeItem('taoman_admin_email')
    onLogin(data.user)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (tempToken) {
        const data = await authService.verify2fa(tempToken, code2fa)
        finishLogin(data)
      } else {
        const data = await authService.adminLogin(email.trim().toLowerCase(), password)
        if (data.requires2fa) {
          setTempToken(data.tempToken)
          setError('')
        } else if (data.requires2faSetup) {
          setError(
            'Votre compte requiert la configuration du 2FA avant la première connexion. ' +
              'Demandez au Super Admin de désactiver cette exigence ou utilisez une session déjà configurée.',
          )
        } else {
          finishLogin(data)
        }
      }
    } catch (err) {
      if (!err.response) {
        setError(
          'Impossible de joindre l\'API. Vérifiez VITE_API_URL sur Vercel (https://backend-tao.onrender.com/v1) et CORS_ORIGINS sur le backend.',
        )
      } else if (err.response?.data?.requires2fa) {
        setTempToken(err.response.data.tempToken)
        setError('')
      } else {
        setError(
          err.response?.data?.message ||
            'Identifiants incorrects ou code 2FA invalide.',
        )
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF7F2 0%, #E8EEFF 100%)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logoPng} alt="TAOMAN Group Investments" style={{ width: 88, height: 88, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 800, color: '#0F1E3D', letterSpacing: '0.02em' }}>TAOMAN</div>
          <div style={{ fontSize: 13, color: '#3D5A99', fontWeight: 600, marginTop: 4 }}>Group Investments</div>
          <div style={{ fontSize: 11, color: '#7A9CC9', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8 }}>Portail administrateur</div>
          <div style={{ fontSize: 10, color: '#B0C4E8', marginTop: 12 }}>API : {API_BASE}</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 36,
          border: '1.5px solid rgba(30,91,184,0.12)', boxShadow: '0 24px 80px rgba(30,91,184,0.1)',
        }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, color: '#B91C1C', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {!tempToken ? (
              <>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@taoman.com" required />
                </div>
                <div className="field">
                  <label className="label">Mot de passe</label>
                  <input className="input" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7A9CC9' }}>
                    {showPwd ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Se souvenir de moi
                </label>
              </>
            ) : (
              <div className="field">
                <label className="label">Code 2FA (6 chiffres)</label>
                <input className="input" type="text" value={code2fa} onChange={(e) => setCode2fa(e.target.value)} placeholder="000000" maxLength={6} required autoFocus />
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Connexion...' : tempToken ? 'Vérifier 2FA' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
