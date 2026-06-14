import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw } from 'lucide-react'
import { StatusBadge, EmptyState, SearchBar, Modal, Loading } from '../components/UI'
import { DOC_LABELS } from '../constants/documentTypes'
import { documentsService } from '../services/api'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { getDocumentSubmitterName } from '../utils/documentSubmitter'

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

function DocImagePreview({ url, alt }) {
  const [failed, setFailed] = useState(false)
  if (!url) {
    return (
      <div style={{ height: 120, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--text3)', fontSize: 13 }}>
        Aperçu non disponible
      </div>
    )
  }
  if (failed) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)' }}>
          Impossible d&apos;afficher l&apos;image ici.
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--blue)' }}>
          Ouvrir l&apos;image dans un nouvel onglet
        </a>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', maxHeight: 400, objectFit: 'contain', marginBottom: 16, background: 'var(--surface2)' }}
      onError={() => setFailed(true)}
    />
  )
}

export default function Documents() {
  const [documents,     setDocuments]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('PENDING')
  const [search,        setSearch]        = useState('')
  const [selected,      setSelected]      = useState(null)
  const navigate = useNavigate()

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await documentsService.getAll(statusFilter)
      const list = Array.isArray(response) ? response : response?.items || []
      setDocuments(list)
    } catch (err) {
      setError('Impossible de charger les documents.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadDocuments() }, [loadDocuments])
  useRealtimeSync(loadDocuments, {
    interval: 60000,
    debounceMs: 2000,
    topics: ['document', 'documents'],
    enabled: true,
  })

  const getDriverName = getDocumentSubmitterName
  const getFileUrl    = doc => doc.fileUrl || doc.url || null
  const formatDate    = d  => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const pendingCount = documents.filter(d => d.status === 'PENDING').length

  const visibleDocuments = documents.filter(doc => {
    const text = getDriverName(doc).toLowerCase()
    return !search || text.includes(search.toLowerCase())
  })

  const getDocumentIcon = (type) => {
    const icons = {
      DRIVERS_LICENSE: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      INSURANCE: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      VEHICLE_REGISTRATION: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z',
      ID_CARD_FRONT: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    }
    return icons[type] || 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }

  return (
    <div className="fade-in">
      <div style={{ padding: '24px 28px 40px' }}>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Documents KYC (consultation)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Consultez les pièces d&apos;identité. La validation se fait au niveau du compte investisseur.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)', marginRight: 'auto' }}>
            {pendingCount} document(s) en attente
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadDocuments}>
            <RefreshCw size={14} /> Rafraîchir
          </button>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un chauffeur..." />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvés</option>
            <option value="REJECTED">Rejetés</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, color: '#B91C1C', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? <Loading /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleDocuments.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(43,95,245,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" fill="none" stroke="#2B5FF5" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={getDocumentIcon(doc.type)} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {DOC_LABELS[doc.type] || doc.type?.replace(/_/g, ' ') || 'Document'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{getDriverName(doc)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(doc.createdAt || doc.uploadedAt)}</div>
                  {doc.rejectionReason && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>❌ {doc.rejectionReason}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <StatusBadge status={doc.status} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(doc)}>
                      <Eye size={13} /> Voir
                    </button>
                    {doc.user?.id && (
                      <button className="btn btn-sm" onClick={() => navigate(`/investors/${doc.user.id}`)}>
                        Fiche investisseur
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {visibleDocuments.length === 0 && <EmptyState message="Aucun document trouvé" />}
          </div>
        )}
      </div>

      {selected && (
        <Modal
          title={DOC_LABELS[selected.type] || selected.type}
          onClose={() => setSelected(null)}
        >
          <DocImagePreview url={getFileUrl(selected)} alt={DOC_LABELS[selected.type] || 'Document KYC'} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatusBadge status={selected.status} />
            <span style={{ padding: '2px 10px', borderRadius: 5, fontSize: 11, background: 'var(--surface2)', color: 'var(--text2)' }}>
              {DOC_LABELS[selected.type] || selected.type}
            </span>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            <strong>Investisseur :</strong> {getDriverName(selected)} &nbsp;•&nbsp; {formatDate(selected.createdAt || selected.uploadedAt)}
          </div>

          {selected.user?.id && (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/investors/${selected.user.id}`)}>
              Valider le compte investisseur
            </button>
          )}
        </Modal>
      )}
    </div>
  )
}
