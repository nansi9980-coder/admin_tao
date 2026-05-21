import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from 'recharts'
import {
  Users, TrendingUp, FileCheck, Wallet, Layers, PiggyBank,
  ArrowRight, RefreshCw, AlertCircle,
} from 'lucide-react'
import {
  dashboardService, documentsService, financeService,
  subscriptionsService, investorsService, plansService,
} from '../services/api'
import {
  StatCard, Loading, StatusBadge, Avatar,
} from '../components/UI'
import DataTable from '../components/DataTable'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

const formatXof = (v, compact = false) => {
  if (v == null || v === '') return '0 FCFA'
  const n = Number(v) / 100
  if (compact && n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [financeStats, setFinanceStats] = useState(null)
  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [chart, setChart] = useState([])
  const [pendingDocs, setPendingDocs] = useState([])
  const [pendingDeposits, setPendingDeposits] = useState([])
  const [recentSubs, setRecentSubs] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [
        s, fin, c, docs, dep, subs, users, plansList,
      ] = await Promise.all([
        dashboardService.getStats(),
        financeService.getStats(),
        financeService.getChart(chartPeriod),
        documentsService.getAll('PENDING'),
        financeService.getPendingDeposits(),
        subscriptionsService.getAll({ limit: 8, page: 1 }),
        investorsService.getAll({ limit: 6, page: 1 }),
        plansService.getAll(),
      ])
      setStats(s)
      setFinanceStats(fin)
      setChart((c || []).map((d) => ({
        date: d.date?.slice(5) || d.date,
        deposits: Number(d.deposits) / 100,
        withdrawals: Number(d.withdrawals) / 100,
      })))
      setPendingDocs(Array.isArray(docs) ? docs.slice(0, 6) : [])
      setPendingDeposits(Array.isArray(dep) ? dep.slice(0, 6) : [])
      setRecentSubs(subs?.items || [])
      setRecentUsers(users?.items || [])
      setPlans(Array.isArray(plansList) ? plansList.slice(0, 4) : [])
      setLastSync(new Date())
    } catch {
      setStats(null)
    }
    setLoading(false)
  }, [chartPeriod])

  useEffect(() => { load() }, [load])
  useRealtimeSync(load, { interval: 45000, debounceMs: 2000, topics: ['dashboard', 'kyc', 'transaction', 'finance', 'subscription', 'user'] })

  const confirmDeposit = async (id) => {
    await financeService.confirmTransaction(id)
    load()
  }

  const chartEmpty = chart.length === 0

  const financeBarData = financeStats ? [
    { name: 'Dépôts', value: Number(financeStats.totalDepositsXof || 0) / 100, fill: '#2B5FF5' },
    { name: 'Retraits', value: Number(financeStats.totalWithdrawalsXof || 0) / 100, fill: '#E89B3C' },
    { name: 'Souscriptions', value: Number(financeStats.totalSubscriptionsXof || 0) / 100, fill: '#10B981' },
  ] : []

  if (loading && !stats) return <Loading text="Chargement du tableau de bord..." />

  return (
    <div style={{ padding: '24px 28px 40px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Actualiser
        </button>
        {lastSync && (
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            MAJ {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Alertes */}
      {(stats?.pendingKyc > 0 || stats?.pendingDeposits > 0) && (
        <div className="card fade-up" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid var(--orange)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-l)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} color="var(--orange)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Actions requises</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {stats?.pendingKyc || 0} document(s) KYC et {stats?.pendingDeposits || 0} dépôt(s) en attente de validation.
            </div>
          </div>
          <Link to="/documents" className="btn btn-sm btn-primary">Traiter KYC</Link>
          <Link to="/finance" className="btn btn-sm btn-ghost">Finances</Link>
        </div>
      )}

      {/* KPIs */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Investisseurs" value={stats?.totalUsers ?? 0} color="#2B5FF5" delay={0}
          iconPath="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0M9 7a4 4 0 0 1 8 0" />
        <StatCard label="Souscriptions actives" value={stats?.activeSubscriptions ?? 0} color="#10B981" delay={60}
          iconPath="M22 12h-4l-3 9L9 3l-3 9H2" />
        <StatCard label="KYC en attente" value={stats?.pendingKyc ?? 0} color="#E89B3C" delay={120}
          iconPath="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        <StatCard label="Dépôts en attente" value={stats?.pendingDeposits ?? 0} color="#F59E0B" delay={180}
          iconPath="M12 8v8m0 0H8m4 0h4m4-8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8" />
        <StatCard label="Plans ouverts" value={stats?.plansOpen ?? 0} color="#8B5CF6" delay={240}
          iconPath="M4 6h16M4 10h16M4 14h16M4 18h16" />
        <StatCard label="Collecté total" value={formatXof(stats?.totalCollectedXof, true)} color="#1E5BB8" delay={300}
          iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora,sans-serif' }}>Flux financiers</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Dépôts vs retraits (FCFA)</p>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 10 }}>
              {['weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: chartPeriod === p ? 'var(--surface)' : 'transparent',
                    color: chartPeriod === p ? 'var(--blue)' : 'var(--text3)',
                    boxShadow: chartPeriod === p ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {p === 'weekly' ? '7 jours' : '30 jours'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 280 }}>
            {chartEmpty ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
                Pas encore de transactions sur cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2B5FF5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2B5FF5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E89B3C" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#E89B3C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,95,245,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A9CC9' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7A9CC9' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA'}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="deposits" name="Dépôts" stroke="#2B5FF5" fill="url(#depGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="withdrawals" name="Retraits" stroke="#E89B3C" fill="url(#withGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora,sans-serif', marginBottom: 4 }}>Répartition</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Volumes cumulés</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(43,95,245,0.08)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v) => formatXof(String(Number(v) * 100))} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plans — progression */}
      {plans.length > 0 && (
        <div className="card" style={{ padding: 22, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora,sans-serif' }}>Plans — collecte</h3>
            <Link to="/plans" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {plans.map((p) => {
              const cap = Number(p.capacityXof || 0)
              const col = Number(p.collectedXof || 0)
              const pct = cap > 0 ? Math.min(100, Math.round((col / cap) * 100)) : 0
              return (
                <div key={p.id} style={{ padding: 14, background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{p.sector} · {p.annualRatePct}% / an</div>
                  <div className="progress" style={{ marginBottom: 6 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)' }}>
                    <span>{formatXof(p.collectedXof, true)}</span>
                    <span>{pct}% · {formatXof(p.capacityXof, true)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tables file d'attente */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Dépôts en attente</h3>
            <Link to="/finance" className="btn btn-sm btn-ghost">Finances</Link>
          </div>
          <DataTable
            compact
            emptyMessage="Aucun dépôt en attente"
            columns={[
              { key: 'user', label: 'Investisseur', render: (r) => r.userEmail || r.user?.email || '—' },
              { key: 'amount', label: 'Montant', align: 'right', render: (r) => <strong>{formatXof(r.amountXof)}</strong> },
              {
                key: 'actions', label: '', align: 'right',
                render: (r) => (
                  <button type="button" className="btn btn-sm btn-success" onClick={(e) => { e.stopPropagation(); confirmDeposit(r.id) }}>
                    Confirmer
                  </button>
                ),
              },
            ]}
            rows={pendingDeposits}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>KYC en attente</h3>
            <Link to="/documents" className="btn btn-sm btn-ghost">Documents</Link>
          </div>
          <DataTable
            compact
            emptyMessage="Aucun document en attente"
            columns={[
              { key: 'name', label: 'Investisseur', render: (d) => d.submitterName || d.user?.email || '—' },
              { key: 'type', label: 'Type', render: (d) => <span style={{ color: 'var(--text3)', fontSize: 12 }}>{d.type}</span> },
              { key: 'date', label: 'Date', align: 'right', render: (d) => formatDate(d.createdAt) },
            ]}
            rows={pendingDocs}
          />
        </div>
      </div>

      {/* Dernières activités */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Dernières souscriptions</h3>
            <Link to="/subscriptions" className="btn btn-sm btn-ghost">Tout voir</Link>
          </div>
          <DataTable
            compact
            emptyMessage="Aucune souscription"
            columns={[
              { key: 'user', label: 'Investisseur', render: (r) => r.userName || '—' },
              { key: 'plan', label: 'Plan', render: (r) => r.planTitle },
              { key: 'amount', label: 'Montant', align: 'right', render: (r) => formatXof(r.amountXof) },
              { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={recentSubs}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Nouveaux investisseurs</h3>
            <Link to="/investors" className="btn btn-sm btn-ghost">Tout voir</Link>
          </div>
          <DataTable
            compact
            emptyMessage="Aucun investisseur"
            columns={[
              {
                key: 'name',
                label: 'Investisseur',
                render: (u) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email} size={32} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'kyc', label: 'KYC', render: (u) => <StatusBadge status={u.kycStatus} /> },
              { key: 'account', label: 'Compte', render: (u) => <StatusBadge status={u.accountStatus} /> },
            ]}
            rows={recentUsers}
            onRowClick={(u) => navigate(`/investors/${u.id}`)}
          />
        </div>
      </div>

      {/* Raccourcis */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { to: '/investors', label: 'Investisseurs', icon: Users, color: '#2B5FF5' },
          { to: '/finance', label: 'Finances', icon: Wallet, color: '#E89B3C' },
          { to: '/plans', label: 'Nouveau plan', icon: Layers, color: '#8B5CF6' },
          { to: '/documents', label: 'KYC', icon: FileCheck, color: '#10B981' },
          { to: '/audit', label: 'Audit', icon: TrendingUp, color: '#06B6D4' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="card card-hover"
            style={{
              padding: 16, textDecoration: 'none', color: 'var(--text)', display: 'flex',
              alignItems: 'center', gap: 12,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
