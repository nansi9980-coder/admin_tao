import { useState, useCallback, useEffect, useMemo } from 'react'
import { Filter } from 'lucide-react'
import { auditService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

function moduleOf(log) {
  return (log.action || log.resource || '').split('.')[0] || '—'
}

function typeOf(log) {
  return log.resource || '—'
}

function actorLabel(log) {
  if (log.actor) {
    const name = [log.actor.firstName, log.actor.lastName].filter(Boolean).join(' ')
    return { name: name || log.actor.email, email: log.actor.email }
  }
  return { name: 'Système', email: '' }
}

function detailLabel(log) {
  if (!log.metadata) return '—'
  try {
    const entries = Object.entries(log.metadata)
    if (!entries.length) return '—'
    return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')
  } catch {
    return '—'
  }
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditService.getAll({
        limit: 200,
        ...(search && { search }),
        ...(from && { from: new Date(from).toISOString() }),
        ...(to && { to: new Date(to + 'T23:59:59').toISOString() }),
      })
      setLogs(res?.items || [])
    } catch {
      setLogs([])
    }
    setLoading(false)
  }, [search, from, to])

  useEffect(() => { load() }, [load])

  const modules = useMemo(() => ['ALL', ...new Set(logs.map(moduleOf))], [logs])
  const actions = useMemo(() => ['ALL', ...new Set(logs.map((l) => l.action))], [logs])

  const filtered = useMemo(() => logs.filter((l) => {
    if (moduleFilter !== 'ALL' && moduleOf(l) !== moduleFilter) return false
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false
    if (userFilter) {
      const { name, email } = actorLabel(l)
      const q = userFilter.toLowerCase()
      if (!name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) return false
    }
    return true
  }), [logs, moduleFilter, actionFilter, userFilter])

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input" placeholder="Rechercher..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: 160 }}
          />
          <input
            className="input" placeholder="Utilisateur"
            value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
            style={{ flex: '1 1 160px', minWidth: 140 }}
          />
          <select className="input" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} style={{ minWidth: 140 }}>
            {modules.map((m) => <option key={m} value={m}>{m === 'ALL' ? 'Tous modules' : m}</option>)}
          </select>
          <select className="input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ minWidth: 160 }}>
            {actions.map((a) => <option key={a} value={a}>{a === 'ALL' ? 'Toutes actions' : a}</option>)}
          </select>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ minWidth: 150 }} />
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ minWidth: 150 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
          <Filter size={13} /> {filtered.length} événement(s)
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
          Événements ({filtered.length})
        </div>
        {loading ? <Loading /> : filtered.length === 0 ? <EmptyState title="Aucun événement" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Date / Heure</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Utilisateur</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Module</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Détail / Valeurs</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const actor = actorLabel(l)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{actor.name}</div>
                        {actor.email && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{actor.email}</div>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: 'rgba(30,91,184,0.1)', color: '#1E5BB8',
                        }}>{l.action}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{moduleOf(l)}</td>
                      <td style={{ padding: '10px 14px' }}>{typeOf(l)}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text2)' }}>
                        {l.resourceId ? l.resourceId.slice(0, 8) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)', maxWidth: 280 }}>{detailLabel(l)}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text2)' }}>{l.ip || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
