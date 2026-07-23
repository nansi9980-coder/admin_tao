import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import AdminLayout from './components/AdminLayout'
import TopBar from './components/TopBar'
import CommandPalette from './components/CommandPalette'
import NotificationDrawer from './components/NotificationDrawer'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Investors from './pages/Investors'
import Subscriptions from './pages/Subscriptions'
import Finance from './pages/Finance'
import AuditLogs from './pages/AuditLogs'
import Plans from './pages/Plans'
import Banners from './pages/Banners'
import ServiceRequests from './pages/ServiceRequests'
import ServiceSectors from './pages/ServiceSectors'
import InvestorDetail from './pages/InvestorDetail'
import Settings from './pages/Settings'
import AdminUsers from './pages/AdminUsers'
import Cms from './pages/Cms'
import MediaLibrary from './pages/MediaLibrary'
import { documentsService, financeService, serviceRequestsService } from './services/api'
import toast, { Toaster } from 'react-hot-toast'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { hasPerm } from './utils/permissions'
import './index.css'

export default function App() {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('taoman_admin_token')
    if (!t) return null
    try {
      const savedUser = localStorage.getItem('taoman_admin_user')
      if (savedUser) return JSON.parse(savedUser)
    } catch {}
    return { name: 'Administrateur', email: '', role: 'READ_ONLY' }
  })

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('taoman_sidebar_collapsed') === '1')
  const [theme, setTheme] = useState(() => localStorage.getItem('taoman_admin_theme') || 'light')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const role = user?.role || 'READ_ONLY'
  const permissions = user?.permissions || []
  const authUser = { role, permissions }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('taoman_admin_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('taoman_sidebar_collapsed', collapsed ? '1' : '0')
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '76px' : '240px')
  }, [collapsed])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogin = (userData) => {
    localStorage.setItem('taoman_admin_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('taoman_admin_token')
    localStorage.removeItem('taoman_admin_user')
    setUser(null)
  }

  const [badges, setBadges] = useState({ docs: 0, finance: 0 })
  const prevBadgesRef = useRef({ docs: 0, finance: 0 })

  const loadBadges = useCallback(async () => {
    try {
      const tasks = []
      if (hasPerm(authUser, 'kyc.view')) tasks.push(documentsService.getAll('PENDING')); else tasks.push(Promise.resolve([]))
      if (hasPerm(authUser, 'finance.view')) tasks.push(financeService.getPendingDeposits()); else tasks.push(Promise.resolve([]))
      if (hasPerm(authUser, 'service-requests.view')) tasks.push(serviceRequestsService.getAll('PENDING')); else tasks.push(Promise.resolve([]))
      const [docs, pending, requests] = await Promise.all(tasks)
      const next = {
        docs: Array.isArray(docs) ? docs.length : 0,
        finance: Array.isArray(pending) ? pending.length : 0,
        requests: Array.isArray(requests) ? requests.length : 0,
      }
      const prev = prevBadgesRef.current
      const items = []
      if (next.docs > prev.docs) {
        toast('Nouveau document KYC en attente')
        items.push({ id: `doc-${Date.now()}`, type: 'document', title: 'Nouveau KYC en attente', body: `${next.docs} documents à vérifier`, createdAt: new Date().toISOString(), link: '/documents' })
      }
      if (next.finance > prev.finance) {
        toast('Nouveau dépôt en attente de confirmation')
        items.push({ id: `fin-${Date.now()}`, type: 'finance', title: 'Dépôt en attente', body: `${next.finance} dépôts à confirmer`, createdAt: new Date().toISOString(), link: '/finance' })
      }
      if (next.requests > (prev.requests || 0)) {
        toast('Nouvelle demande de service')
        items.push({ id: `svc-${Date.now()}`, type: 'service-request', title: 'Demande de service', body: `${next.requests} demandes à traiter`, createdAt: new Date().toISOString(), link: '/service-requests' })
      }
      if (items.length) setNotifications((n) => [...items, ...n].slice(0, 20))
      prevBadgesRef.current = next
      setBadges(next)
    } catch {
      setBadges({ docs: 0, finance: 0, requests: 0 })
    }
  }, [role])

  useEffect(() => {
    if (!user) return
    loadBadges()
  }, [user, loadBadges])

  useRealtimeSync(loadBadges, {
    enabled: Boolean(user),
    interval: 45000,
    debounceMs: 2000,
    topics: ['document', 'documents', 'kyc', 'transaction', 'finance', 'service-request'],
  })

  if (!user) return <Login onLogin={handleLogin} />

  const notifCount = (badges.docs || 0) + (badges.finance || 0) + (badges.requests || 0)

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: theme === 'dark' ? '#0F1E3D' : '#fff', color: theme === 'dark' ? '#fff' : '#0F1E3D' },
      }} />
      <div className={`admin-shell theme-${theme}`} style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          badges={badges}
          user={user}
          onLogout={logout}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
        <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s' }}>
          <TopBar
            user={user}
            theme={theme}
            notifCount={notifCount}
            onSearchClick={() => setPaletteOpen(true)}
            onNotificationsClick={() => setNotifOpen(true)}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          />
          <AnimatedRoutes role={authUser} />
        </main>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={authUser} />
        <NotificationNav
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          items={notifications}
        />
      </div>
    </BrowserRouter>
  )
}

function NotificationNav({ open, onClose, items }) {
  const navigate = useNavigate()
  return (
    <NotificationDrawer
      open={open}
      onClose={onClose}
      items={items}
      onClickItem={(it) => {
        if (it.link) navigate(it.link)
      }}
    />
  )
}

function AnimatedRoutes({ role }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : 'root'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ flex: 1, overflow: 'auto' }}
      >
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Guard perm="dashboard.view" role={role}><Dashboard /></Guard>} />
            <Route path="/investors" element={<Guard perm="users.view" role={role}><Investors /></Guard>} />
            <Route path="/investors/:id" element={<Guard perm="users.view" role={role}><InvestorDetail /></Guard>} />
            <Route path="/subscriptions" element={<Guard perm="subscriptions.view" role={role}><Subscriptions /></Guard>} />
            <Route path="/documents" element={<Guard perm="kyc.view" role={role}><Documents /></Guard>} />
            <Route path="/service-requests" element={<Guard perm="service-requests.view" role={role}><ServiceRequests /></Guard>} />
            <Route path="/service-sectors" element={<Guard perm="sectors.view" role={role}><ServiceSectors /></Guard>} />
            <Route path="/plans" element={<Guard perm="plans.view" role={role}><Plans /></Guard>} />
            <Route path="/banners" element={<Guard perm="banners.view" role={role}><Banners /></Guard>} />
            <Route path="/finance" element={<Guard perm="finance.view" role={role}><Finance /></Guard>} />
            <Route path="/audit" element={<Guard perm="audit.view" role={role}><AuditLogs /></Guard>} />
            <Route path="/admin-users" element={<Guard perm="admins.manage" role={role}><AdminUsers /></Guard>} />
            <Route path="/cms" element={<Guard perm="cms.view" role={role}><Cms role={role} /></Guard>} />
            <Route path="/mediatek" element={<Guard perm="media.view" role={role}><MediaLibrary /></Guard>} />
            <Route path="/settings" element={<Guard perm="settings.view" role={role}><Settings /></Guard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function Guard({ children, perm, role }) {
  if (!hasPerm(role, perm)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: '#1E5BB8' }}>Accès restreint</h2>
        <p style={{ color: '#5A6F94' }}>Votre rôle ne permet pas d'accéder à cette section.</p>
      </div>
    )
  }
  return children
}
