import { useState, useCallback } from 'react'
import { driversService, documentsService } from '../services/api'
import { SearchBar, StatusBadge, Avatar, Loading, EmptyState, StatCard, InfoRow, FilterTabs } from '../components/UI'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { getDocumentSubmitterName } from '../utils/documentSubmitter'

export default function Drivers() {
  const [drivers,    setDrivers]    = useState([])
  const [selected,    setSelected]  = useState(null)
  const [search,      setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading,     setLoading]   = useState(true)
  const [error,       setError]    = useState(null)
  const [driverDocs,   setDriverDocs] = useState([])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const d = await driversService.getAll()
      const raw = Array.isArray(d) ? d : (d?.items ?? [])
      // Aplatir user dans le driver pour simplifier l'accès
      const list = raw.map(driver => ({
        ...driver,
        ...(driver.user || {}),
        id: driver.userId || driver.id,
        profileId: driver.id,
      }))
      setDrivers(list)
    } catch(e) {
      setError(e?.response?.data?.message || 'Erreur de chargement')
    }
    setLoading(false)
  }, [])

  useRealtimeSync(load, { interval: 25000, topics: ['driver','drivers','account'] })

  const getDriverName = (d) => [d.user?.firstName ?? d.firstName, d.user?.lastName ?? d.lastName].filter(Boolean).join(' ') || d.user?.name || d.name || '—'

  const filtered = drivers.filter(d => {
    const name = getDriverName(d)
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search)
    const matchFilter = statusFilter === 'ALL' || d.accountStatus === statusFilter || d.user?.accountStatus === statusFilter
    return matchSearch && matchFilter
  })

  const activeCount = drivers.filter(d => d.accountStatus === 'ACTIVE').length
  const pendingCount = drivers.filter(d => ['PENDING','ADMIN_REVIEW_PENDING','DOCUMENTS_PENDING'].includes(d.accountStatus) || d.approvalStatus === 'PENDING').length
  const suspendedCount = drivers.filter(d => d.accountStatus === 'SUSPENDED').length
  const newThisMonth = drivers.filter(d => {
    if (!d.createdAt) return false
    const dt = new Date(d.createdAt), n = new Date()
    return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear()
  }).length

  const toggleSuspend = async (d) => {
    try {
      if (d.accountStatus === 'SUSPENDED') await driversService.activate(d.profileId || d.id)
      else await driversService.suspend(d.profileId || d.id)
      setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, accountStatus: d.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : x))
      if (selected?.id === d.id) setSelected(prev => ({ ...prev, accountStatus: d.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }))
    } catch(e) { alert('Erreur: ' + (e?.response?.data?.message || e.message)) }
  }

  const viewDriverDetails = async (d) => {
    setSelected(d)
    try {
      const docs = await documentsService.getAll('ALL')
      const driverDocsList = Array.isArray(docs) ? docs.filter(doc => doc.userId === d.id || doc.driverId === d.id) : []
      setDriverDocs(driverDocsList)
    } catch (err) {
      setDriverDocs([])
    }
  }

  const approveDriver = async (d) => {
    try {
      await driversService.approve(d.profileId || d.id)
      setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, accountStatus: 'ACTIVE', approvalStatus: 'APPROVED' } : x))
      if (selected?.id === d.id) setSelected(prev => ({ ...prev, accountStatus: 'ACTIVE', approvalStatus: 'APPROVED' }))
    } catch(e) { alert('Erreur: ' + (e?.response?.data?.message || e.message)) }
  }

  const rejectDriver = async (d) => {
    const reason = prompt('Raison du rejet:')
    if (!reason) return
    try {
      await driversService.reject(d.profileId || d.id, reason)
      setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, accountStatus: 'REJECTED', approvalStatus: 'REJECTED', rejectionReason: reason } : x))
      if (selected?.id === d.id) setSelected(prev => ({ ...prev, accountStatus: 'REJECTED', approvalStatus: 'REJECTED', rejectionReason: reason }))
    } catch(e) { alert('Erreur: ' + (e?.response?.data?.message || e.message)) }
  }

  const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED']

  return (
    <div style={{ display:'flex', height:'100vh', flexDirection:'column' }}>
      <div style={{ padding:'22px 28px 20px', borderBottom:'1.5px solid var(--border)' }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, marginBottom:4, color:'var(--text)' }}>Gestion des Chauffeurs</h1>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Supervisez tous les comptes chauffeurs de la plateforme.</p>
      </div>

      <div style={{ padding:'20px 28px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Total Chauffeurs" value={drivers.length} trend="+8%" color="var(--blue)" delay={0}
          iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        <StatCard label="Actifs" value={activeCount} trend="+5%" color="var(--green)" delay={60}
          iconPath="M13 10V3L4 14h7v7l9-11h-7z"/>
        <StatCard label="En attente" value={pendingCount} trend="" color="var(--orange)" delay={120}
          iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        <StatCard label="Nouveaux ce mois" value={newThisMonth} trend="+12%" color="var(--purple)" delay={180}
          iconPath="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden', padding:'0 28px 24px', gap:16 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, email ou téléphone..."/>
            <FilterTabs options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter}/>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Actualiser</button>
          </div>
          {error && (
            <div style={{ padding:'12px 16px', background:'var(--red-l)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:10, marginBottom:12 }}>
              <div style={{ fontSize:13, color:'var(--red)' }}>{error}</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }} onClick={load}>Réessayer</button>
            </div>
          )}
          <div className="table-wrap" style={{ overflow:'auto', flex:1 }}>
            {loading ? <Loading/> : (
              <table>
                <thead><tr><th>Chauffeur</th><th>Contact</th><th>Véhicule</th><th>Courses</th><th>Note</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} onClick={() => viewDriverDetails(d)} className={selected?.id === d.id ? 'selected' : ''} style={{ cursor:'pointer' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={getDriverName(d)} size={36}/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{getDriverName(d)}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>#{d.id?.slice(-6)?.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td><div style={{ fontSize:12 }}>{d.email}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{d.phone || '—'}</div></td>
                      <td>
                        <div style={{ fontSize:12, fontWeight:500 }}>{d.vehicle?.model || d.vehicleType || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{d.vehicle?.plate || d.licensePlate || '—'}</div>
                      </td>
                      <td style={{ fontWeight:700 }}>{d.rideCount || d.totalRides || 0}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ color:'var(--orange)' }}>★</span>
                          <span style={{ fontWeight:600, fontSize:13 }}>{d.rating?.toFixed(1) ?? '—'}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={d.accountStatus || d.approvalStatus || 'PENDING'}/></td>
                      <td>
                        <button onClick={e => { e.stopPropagation(); toggleSuspend(d) }}
                          className={d.accountStatus === 'SUSPENDED' ? 'btn btn-success btn-sm' : 'btn btn-danger btn-sm'}>
                          {d.accountStatus === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filtered.length === 0 && <EmptyState message="Aucun chauffeur trouvé"/>}
            <div style={{ padding:'12px 16px', fontSize:12, color:'var(--text3)', borderTop:'1px solid var(--border)' }}>
              {filtered.length} sur {drivers.length} chauffeurs
            </div>
          </div>
        </div>

        {selected && (
          <div className="card slide-r" style={{ width:320, flexShrink:0, overflow:'auto' }}>
            <div style={{ textAlign:'center', padding:'20px 16px 14px' }}>
              <Avatar name={getDriverName(selected)} size={64}/>
              <div style={{ fontWeight:800, fontSize:16, marginTop:10, color:'var(--text)' }}>{getDriverName(selected)}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{selected.email}</div>
              <div style={{ marginTop:8 }}><StatusBadge status={selected.accountStatus || selected.approvalStatus || 'PENDING'}/></div>
            </div>
            <div style={{ padding:'0 16px 16px' }}>
              <InfoRow label="Téléphone" value={selected.phone}/>
              <InfoRow label="Immatriculation" value={selected.vehicle?.plate || selected.licensePlate || '—'}/>
              <InfoRow label="Véhicule" value={selected.vehicle?.model || selected.vehicleType || '—'}/>
              <InfoRow label="Inscription" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('fr-FR') : '—'}/>
              <InfoRow label="Courses totales" value={selected.rideCount || selected.totalRides || 0}/>
              <InfoRow label="Note moyenne" value={selected.rating ? `${selected.rating.toFixed(1)} ★` : '—'}/>
              <InfoRow label="Dernière connexion" value={selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString('fr-FR') : '—'}/>
              {selected.rejectionReason && (
                <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10 }}>
                  <div style={{ fontSize:11, color:'#EF4444', fontWeight:600, marginBottom:4 }}>Raison du rejet</div>
                  <div style={{ fontSize:12, color:'#EF4444' }}>{selected.rejectionReason}</div>
                </div>
              )}
            </div>

            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
              {!['ACTIVE','SUSPENDED','REJECTED'].includes(selected.accountStatus) && (
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <button onClick={() => approveDriver(selected)} className="btn btn-success btn-full" style={{ flex:1 }}>
                    ✓ Approuver
                  </button>
                  <button onClick={() => rejectDriver(selected)} className="btn btn-danger btn-full" style={{ flex:1 }}>
                    ✗ Rejeter
                  </button>
                </div>
              )}
              <button onClick={() => toggleSuspend(selected)}
                className={selected.accountStatus === 'SUSPENDED' ? 'btn btn-success btn-full' : 'btn btn-danger btn-full'}>
                {selected.accountStatus === 'SUSPENDED' ? '✅ Réactiver' : '🚫 Suspendre'}
              </button>
            </div>

            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Documents ({driverDocs.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {driverDocs.slice(0,5).map(doc => (
                  <div key={doc.id} style={{ padding:'8px 10px', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{doc.type?.replace(/_/g,' ')}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      {getDocumentSubmitterName(doc)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>
                      {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <StatusBadge status={doc.status} style={{ marginTop:4 }}/>
                  </div>
                ))}
                {driverDocs.length === 0 && (
                  <div style={{ textAlign:'center', color:'var(--text4)', padding:'12px', fontSize:12 }}>
                    Aucun document
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}