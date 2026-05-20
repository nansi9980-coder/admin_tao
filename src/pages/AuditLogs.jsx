import { useState, useCallback, useEffect } from 'react'
import { auditService } from '../services/api'
import { Loading, EmptyState } from '../components/UI'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditService.getAll({ limit: 100 })
      setLogs(res?.items || [])
    } catch {
      setLogs([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Journal de conformité</h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Audit log append-only (BCEAO/CREPMF)</p>

      {loading ? <Loading /> : logs.length === 0 ? <EmptyState title="Aucun log" /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text3)' }}>
              <th style={{ textAlign: 'left', padding: 10 }}>Date</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Action</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Ressource</th>
              <th style={{ textAlign: 'left', padding: 10 }}>Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 10 }}>{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                <td style={{ padding: 10, color: '#1E5BB8' }}>{l.action}</td>
                <td style={{ padding: 10 }}>{l.resource}{l.resourceId ? `/${l.resourceId.slice(0, 8)}` : ''}</td>
                <td style={{ padding: 10, color: '#7A9CC9' }}>{l.hash?.slice(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
