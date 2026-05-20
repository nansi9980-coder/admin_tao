import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './UI'

const TITLES = {
  '/': 'Tableau de bord',
  '/investors': 'Investisseurs',
  '/subscriptions': 'Souscriptions',
  '/documents': 'Documents KYC',
  '/plans': 'Plans d\'investissement',
  '/banners': 'Bannières',
  '/finance': 'Finances',
  '/audit': 'Conformité',
  '/settings': 'Paramètres',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const base = pathname.startsWith('/investors/') ? '/investors' : pathname
  const title = TITLES[base] || 'TAOMAN Admin'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
      <TopBar title={title} />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'linear-gradient(180deg, var(--bg) 0%, #EEF2FF 120%)',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
