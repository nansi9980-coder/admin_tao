// Pages : Passengers, Rides, Revenue, Panics
import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { SearchBar, FilterTabs, StatusBadge, Avatar, Loading, EmptyState, StatCard, InfoRow, TopBar } from '../components/UI'
import { passengersService, ridesService, financeService, panicsService } from '../services/api'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const TT = { background:'var(--surface)', border:'1.5px solid var(--border2)', borderRadius:10, boxShadow:'0 8px 24px rgba(43,95,245,0.12)', fontSize:12, fontFamily:'Plus Jakarta Sans,sans-serif', color:'var(--text)' }

// ── PASSAGERS ─────────────────────────────────────────────────────────────────
export function Passengers() {
  const [passengers, setPassengers] = useState([])
  const [selected,   setSelected]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const d = await passengersService.getAll()
      const list = Array.isArray(d) ? d : (d?.items ?? [])
      setPassengers(list)
    } catch(e) {
      setError(e?.response?.data?.message || 'Erreur de chargement')
    }
    setLoading(false)
  }, [])

  useRealtimeSync(load, { interval: 25000, topics: ['passenger','passengers','account'] })

  const filtered = passengers.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSuspend = async (p) => {
    try {
      if (p.accountStatus === 'SUSPENDED') await passengersService.activate(p.id)
      else await passengersService.suspend(p.id)
      setPassengers(prev => prev.map(x => x.id === p.id ? { ...x, accountStatus: p.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : x))
      if (selected?.id === p.id) setSelected(prev => ({ ...prev, accountStatus: p.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }))
    } catch(e) { alert('Erreur: ' + (e?.response?.data?.message || e.message)) }
  }

  const activeCount = passengers.filter(p => p.accountStatus === 'ACTIVE').length
  const newThisMonth = passengers.filter(p => {
    if (!p.createdAt) return false
    const d = new Date(p.createdAt), n = new Date()
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  }).length

  return (
    <div style={{ display:'flex', height:'100vh', flexDirection:'column' }}>
      <div style={{ padding:'22px 28px 20px', borderBottom:'1.5px solid var(--border)' }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, marginBottom:4, color:'var(--text)' }}>Gestion des Passagers</h1>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Supervisez tous les comptes passagers de la plateforme.</p>
      </div>

      <div style={{ padding:'20px 28px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Total Passagers" value={passengers.length} trend="+12%" color="var(--blue)" delay={0}
          iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        <StatCard label="Actifs" value={activeCount} trend="+5%" color="var(--green)" delay={60}
          iconPath="M13 10V3L4 14h7v7l9-11h-7z"/>
        <StatCard label="Nouveaux ce mois" value={newThisMonth} trend="+8%" color="var(--orange)" delay={120}
          iconPath="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden', padding:'0 28px 24px', gap:16 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom ou email..."/>
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
                <thead><tr><th>Passager</th><th>Contact</th><th>Courses</th><th>Note</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => setSelected(p)} className={selected?.id === p.id ? 'selected' : ''} style={{ cursor:'pointer' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={p.name} size={36}/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{p.name || '—'}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>#{p.id?.slice(-6)?.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td><div style={{ fontSize:12 }}>{p.email}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{p.phone || '—'}</div></td>
                      <td style={{ fontWeight:700 }}>{p.totalRides ?? 0}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ color:'var(--orange)' }}>★</span>
                          <span style={{ fontWeight:600, fontSize:13 }}>{p.rating?.toFixed(1) ?? '—'}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={p.accountStatus}/></td>
                      <td>
                        <button onClick={e => { e.stopPropagation(); toggleSuspend(p) }}
                          className={p.accountStatus === 'SUSPENDED' ? 'btn btn-success btn-sm' : 'btn btn-danger btn-sm'}>
                          {p.accountStatus === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filtered.length === 0 && <EmptyState message="Aucun passager trouvé"/>}
            <div style={{ padding:'12px 16px', fontSize:12, color:'var(--text3)', borderTop:'1px solid var(--border)' }}>
              {filtered.length} sur {passengers.length} passagers
            </div>
          </div>
        </div>

        {selected && (
          <div className="card slide-r" style={{ width:320, flexShrink:0, overflow:'auto' }}>
            <div style={{ textAlign:'center', padding:'20px 16px 14px' }}>
              <Avatar name={selected.name} size={64}/>
              <div style={{ fontWeight:800, fontSize:16, marginTop:10, color:'var(--text)' }}>{selected.name}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{selected.email}</div>
              <div style={{ marginTop:8 }}><StatusBadge status={selected.accountStatus}/></div>
            </div>
            <div style={{ padding:'0 16px 16px' }}>
              <InfoRow label="Téléphone" value={selected.phone}/>
              <InfoRow label="Inscription" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('fr-FR') : '—'}/>
              <InfoRow label="Dernière connexion" value={selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString('fr-FR') : '—'}/>
              <InfoRow label="Courses totales" value={selected.totalRides ?? 0}/>
              <InfoRow label="Note moyenne" value={selected.rating ? `${selected.rating.toFixed(1)} ★` : '—'}/>
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
              <button onClick={() => toggleSuspend(selected)}
                className={selected.accountStatus === 'SUSPENDED' ? 'btn btn-success btn-full' : 'btn btn-danger btn-full'}>
                {selected.accountStatus === 'SUSPENDED' ? '✅ Réactiver' : '🚫 Suspendre'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── COURSES ───────────────────────────────────────────────────────────────────
export function Rides() {
  const [rides,   setRides]   = useState([])
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const d = await ridesService.getAll(100)
      const list = Array.isArray(d) ? d : (d?.items ?? d?.data ?? [])
      setRides(list)
    } catch(e) {
      setError(e?.response?.data?.message || 'Erreur de chargement')
    }
    setLoading(false)
  }, [])

  useRealtimeSync(load, { interval: 15000, topics: ['ride','rides','course'] })

  const FILTERS = ['ALL','REQUESTED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED']

  const filtered = rides.filter(r => {
    const matchFilter = filter === 'ALL' || r.status === filter
    const matchSearch = !search ||
      r.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.passenger?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: rides.length,
    active: rides.filter(r => ['ACCEPTED','IN_PROGRESS','ARRIVED'].includes(r.status)).length,
    completed: rides.filter(r => r.status === 'COMPLETED').length,
    revenue: rides.filter(r => r.status === 'COMPLETED').reduce((s,r) => s + (r.price||0), 0),
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ padding:'22px 28px 20px', borderBottom:'1.5px solid var(--border)' }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Gestion des Courses</h1>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Suivi en temps réel de toutes les courses.</p>
      </div>

      <div style={{ padding:'20px 28px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total', value:stats.total, color:'var(--blue)' },
          { label:'En cours', value:stats.active, color:'var(--orange)' },
          { label:'Terminées', value:stats.completed, color:'var(--green)' },
          { label:'Revenus', value:`€${stats.revenue.toFixed(2)}`, color:'var(--purple)' },
        ].map((s,i) => (
          <div key={i} className="card fade-up" style={{ padding:'16px 18px', animationDelay:`${i*60}ms`, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, overflow:'hidden', padding:'0 28px 24px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher chauffeur, passager, ID..."/>
          <FilterTabs options={FILTERS} value={filter} onChange={setFilter}/>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
        </div>

        {error && (
          <div style={{ padding:'12px 16px', background:'var(--red-l)', borderRadius:10, fontSize:13, color:'var(--red)' }}>
            {error} — <button className="btn btn-ghost btn-sm" onClick={load}>Réessayer</button>
          </div>
        )}

        <div className="table-wrap" style={{ overflow:'auto', flex:1 }}>
          {loading ? <Loading/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Date</th><th>Chauffeur</th><th>Passager</th><th>Type</th><th>Paiement</th><th>Statut</th><th>Prix</th></tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ color:'var(--blue)', fontWeight:700, fontSize:12, fontFamily:'monospace' }}>
                      #{r.id?.slice(-6)?.toUpperCase()}
                    </td>
                    <td style={{ fontSize:12, color:'var(--text2)' }}>
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={r.driver?.name || '?'} size={28}/>
                        <span style={{ fontSize:13 }}>{r.driver?.name || <span style={{ color:'var(--text4)', fontStyle:'italic' }}>En attente</span>}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:13 }}>{r.passenger?.name || '—'}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, background:'var(--blue-l)', color:'var(--blue)', padding:'2px 8px', borderRadius:20 }}>
                        {r.vehicleType || 'MOTO'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:600, background: r.paymentMethod === 'WALLET' ? 'var(--teal-l)' : 'var(--surface3)', color: r.paymentMethod === 'WALLET' ? 'var(--teal)' : 'var(--text2)', padding:'2px 8px', borderRadius:20 }}>
                        {r.paymentMethod === 'WALLET' ? '💳 Wallet' : r.paymentMethod === 'CASH' ? '💵 Espèces' : r.paymentMethod || '—'}
                      </span>
                      {r.isPaid && <span style={{ marginLeft:4, fontSize:10, color:'var(--green)', fontWeight:700 }}>✓ PAYÉ</span>}
                    </td>
                    <td><StatusBadge status={r.status}/></td>
                    <td style={{ fontWeight:700, color:r.price > 0 ? 'var(--text)' : 'var(--text4)' }}>
                      {r.price > 0 ? `€${r.price.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <EmptyState message="Aucune course trouvée"/>}
          <div style={{ padding:'12px 16px', fontSize:12, color:'var(--text3)', borderTop:'1px solid var(--border)' }}>
            {filtered.length} sur {rides.length} courses
          </div>
        </div>
      </div>
    </div>
  )
}

// ── REVENUS ───────────────────────────────────────────────────────────────────
export function Revenue() {
  const [period,   setPeriod]  = useState('weekly')
  const [page,     setPage]    = useState(1)
  const [txs,      setTxs]     = useState([])
  const [chart,    setChart]   = useState([])
  const [stats,    setStats]   = useState({})
  const [loading,  setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, c, s] = await Promise.allSettled([
        financeService.getTransactions(page),
        financeService.getChart(period),
        financeService.getStats(),
      ])
      // Transactions
      if (t.value) {
        const list = Array.isArray(t.value) ? t.value : (t.value?.items ?? t.value?.data ?? [])
        setTxs(list)
      }
      // Chart — backend returns { period, since, points:[{at,amount,type}] }
      if (c.value) {
        const pts = c.value?.points ?? c.value?.data ?? (Array.isArray(c.value) ? c.value : [])
        // Group by date
        const grouped = {}
        pts.forEach(p => {
          const d = new Date(p.at || p.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
          if (!grouped[d]) grouped[d] = { date:d, revenue:0, count:0 }
          if (p.type === 'PAYMENT' || p.type === 'RECHARGE') grouped[d].revenue += Math.abs(p.amount || 0)
          grouped[d].count++
        })
        setChart(Object.values(grouped).slice(-14))
      }
      if (s.value) setStats(s.value)
    } catch {}
    setLoading(false)
  }, [period, page])

  useRealtimeSync(load, { interval: 30000, topics: ['finance','revenue','transaction','payment'] })

  const totalRevenue = stats.paymentAmount ?? stats.revenue ?? 0
  const commission = totalRevenue * 0.20
  const driverShare = totalRevenue * 0.80

  return (
    <div style={{ padding:'24px 28px', overflow:'auto', height:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, marginBottom:4, color:'var(--text)' }}>Gestion des Revenus</h1>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Aperçu financier et suivi des transactions</p>
        </div>
        <button className="btn btn-primary">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exporter CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { l:'Revenu Total',       v:`€${totalRevenue.toFixed(2)}`, c:'var(--blue)',   icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { l:'Commission Plateforme', v:`€${commission.toFixed(2)}`, c:'var(--green)', icon:'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M9 7H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2' },
          { l:'Part Chauffeurs',    v:`€${driverShare.toFixed(2)}`, c:'var(--purple)', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { l:'Transactions',       v:stats.totalTransactions ?? txs.length, c:'var(--orange)', icon:'M4 6h16M4 10h16M4 14h16M4 18h16' },
        ].map((s,i) => (
          <div key={i} className="card fade-up" style={{ padding:'20px', animationDelay:`${i*60}ms`, borderTop:`3px solid ${s.c}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${s.c}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" fill="none" stroke={s.c} strokeWidth="1.8" viewBox="0 0 24 24"><path d={s.icon}/></svg>
              </div>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--text)' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card fade-up" style={{ padding:24, marginBottom:20, animationDelay:'200ms' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>Évolution des Revenus</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>Transactions par jour sur la période</div>
          </div>
          <div style={{ display:'flex', gap:4, background:'var(--surface2)', padding:4, borderRadius:10, border:'1px solid var(--border)' }}>
            {[['weekly','7j'], ['monthly','30j']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)} style={{
                padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:600, transition:'all 0.15s',
                background: period===v ? 'var(--blue)' : 'transparent',
                color: period===v ? '#fff' : 'var(--text2)',
              }}>{l}</button>
            ))}
          </div>
        </div>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2B5FF5" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#2B5FF5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <Tooltip contentStyle={TT} formatter={v => [`€${v.toFixed(2)}`, 'Revenus']}/>
              <Area type="monotone" dataKey="revenue" stroke="#2B5FF5" strokeWidth={2.5} fill="url(#revGrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text4)', fontSize:13 }}>
            {loading ? 'Chargement...' : 'Aucune donnée disponible'}
          </div>
        )}
      </div>

      {/* Transactions table */}
      <div className="card fade-up" style={{ animationDelay:'300ms' }}>
        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1.5px solid var(--border)' }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Transactions Récentes</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Préc.</button>
            <span style={{ padding:'5px 12px', fontSize:12, color:'var(--text3)' }}>Page {page}</span>
            <button className="btn btn-primary btn-sm" onClick={() => setPage(p => p+1)}>Suiv. →</button>
          </div>
        </div>
        {loading ? <Loading/> : (
          <table>
            <thead><tr><th>ID</th><th>Date</th><th>Utilisateur</th><th>Type</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {txs.map(tx => (
                <tr key={tx.id}>
                  <td style={{ color:'var(--blue)', fontWeight:700, fontSize:12, fontFamily:'monospace' }}>#{tx.id?.slice(-6)?.toUpperCase()}</td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={tx.user?.name || '?'} size={28}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500 }}>{tx.user?.name || '—'}</div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>{tx.user?.role || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:600, background: tx.type === 'PAYMENT' ? 'var(--blue-l)' : tx.type === 'RECHARGE' ? 'var(--green-l)' : 'var(--surface3)', color: tx.type === 'PAYMENT' ? 'var(--blue)' : tx.type === 'RECHARGE' ? 'var(--green)' : 'var(--text2)', padding:'2px 8px', borderRadius:20 }}>
                      {tx.type || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight:700, color: tx.amount > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount || 0).toFixed(2)}
                  </td>
                  <td><StatusBadge status={tx.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && txs.length === 0 && <EmptyState message="Aucune transaction trouvée"/>}
      </div>
    </div>
  )
}

export function Panics() {
  const [panics, setPanics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadPanics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await panicsService.getAll()
      const list = Array.isArray(response) ? response : []
      setPanics(list)
    } catch (err) {
      setError("Impossible de charger les alertes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPanics() }, [])
  useRealtimeSync(loadPanics, { interval: 10000, topics: ["panic","sos","alert"], enabled: true })

  const resolvePanic = async (id) => {
    try {
      await panicsService.resolve(id)
      setPanics(p => p.map(panic => panic.id === id ? {...panic, status:"RESOLVED"} : panic))
    } catch (err) {
      console.error("Erreur lors de la résolution:", err)
    }
  }

  return (
    <div className="fade-in" style={{padding:"24px 28px"}}>
      <TopBar title="Alertes SOS" />
      <div className="card" style={{padding:22,marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Alertes de sécurité</div>
            <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>{panics.filter(p=>p.status!=="RESOLVED").length} alerte{panics.filter(p=>p.status!=="RESOLVED").length>1?"s":""} active{panics.filter(p=>p.status!=="RESOLVED").length>1?"s":""}</div>
          </div>
        </div>

        {error && <div style={{padding:"12px 14px",background:"rgba(248,113,113,0.12)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,color:"#B91C1C",marginBottom:16}}>{error}</div>}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {panics.map(panic => (
            <div key={panic.id} style={{display:"flex",alignItems:"center",gap:16,padding:"16px 18px",background:"var(--surface2)",borderRadius:12,border:"1px solid var(--border)"}}>
              <div style={{width:48,height:48,borderRadius:12,background:"rgba(239,68,68,0.10)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:4}}>{panic.type || "Alerte SOS"}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginBottom:2}}>{panic.userName || panic.user?.name || "Utilisateur inconnu"}</div>
                <div style={{fontSize:11,color:"var(--text4)"}}>{panic.createdAt ? new Date(panic.createdAt).toLocaleString("fr-FR") : "Date inconnue"}</div>
                {panic.location && <div style={{fontSize:11,color:"var(--text4)",marginTop:2}}>📍 {panic.location}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <StatusBadge status={panic.status}/>
                {panic.status !== "RESOLVED" && (
                  <button
                    className="btn btn-sm btn-green"
                    onClick={() => resolvePanic(panic.id)}
                    style={{marginTop:8,width:"100%",fontSize:11}}
                  >
                    Résoudre
                  </button>
                )}
              </div>
            </div>
          ))}
          {panics.length === 0 && (
            <div style={{textAlign:"center",color:"var(--text4)",padding:"48px 0",fontSize:13}}>
              {loading ? "Chargement des alertes..." : "Aucune alerte SOS active"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
