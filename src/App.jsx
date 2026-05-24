import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AdminLayout from './components/AdminLayout'
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
import { documentsService, financeService } from './services/api'
import toast, { Toaster } from 'react-hot-toast'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import './index.css'

export default function App() {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('taoman_admin_token')
    if (!t) return null
    try {
      const savedUser = localStorage.getItem('taoman_admin_user')
      if (savedUser) return JSON.parse(savedUser)
    } catch {}
    return { name: 'Administrateur', email: '' }
  })

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
      const [docs, pending] = await Promise.all([
        documentsService.getAll('PENDING'),
        financeService.getPendingDeposits(),
      ])
      const next = {
        docs: Array.isArray(docs) ? docs.length : 0,
        finance: Array.isArray(pending) ? pending.length : 0,
      }
      const prev = prevBadgesRef.current
      if (next.docs > prev.docs) toast('Nouveau document KYC en attente')
      if (next.finance > prev.finance) toast('Nouveau dépôt en attente de confirmation')
      prevBadgesRef.current = next
      setBadges(next)
    } catch {
      setBadges({ docs: 0, finance: 0 })
    }
  }, [])

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

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar badges={badges} user={user} onLogout={logout} />
        <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/investors/:id" element={<InvestorDetail />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/service-requests" element={<ServiceRequests />} />
              <Route path="/service-sectors" element={<ServiceSectors />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/banners" element={<Banners />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
