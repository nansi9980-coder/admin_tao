import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ArrowLeftRight, FileText, Wallet,
  Settings, LogOut, TrendingUp, Shield, Image, ClipboardList, Briefcase,
  ChevronsLeft, ChevronsRight, UserCog, FileEdit, Images,
} from 'lucide-react'
import logoPng from '../assets/logo.png'
import { hasPerm } from '../utils/permissions'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, perm: 'dashboard.view' },
  { to: '/investors', label: 'Investisseurs', icon: Users, perm: 'users.view' },
  { to: '/subscriptions', label: 'Souscriptions', icon: ArrowLeftRight, perm: 'subscriptions.view' },
  { to: '/documents', label: 'Documents KYC', icon: FileText, badge: 'docs', perm: 'kyc.view' },
  { to: '/service-requests', label: 'Demandes services', icon: ClipboardList, perm: 'service-requests.view' },
  { to: '/service-sectors', label: 'Secteurs services', icon: Briefcase, perm: 'sectors.view' },
  { to: '/plans', label: 'Plans', icon: TrendingUp, perm: 'plans.view' },
  { to: '/banners', label: 'Bannières', icon: Image, perm: 'banners.view' },
  { to: '/finance', label: 'Finances', icon: Wallet, badge: 'finance', perm: 'finance.view' },
  { to: '/audit', label: 'Conformité', icon: Shield, perm: 'audit.view' },
  { to: '/admin-users', label: 'Administrateurs', icon: UserCog, perm: 'admins.manage' },
  { to: '/cms', label: 'Contenus app', icon: FileEdit, perm: 'cms.view' },
  { to: '/mediatek', label: 'Mediatheque', icon: Images, perm: 'media.view' },
  { to: '/settings', label: 'Paramètres', icon: Settings, perm: 'settings.view' },
]

export default function Sidebar({ badges = {}, user, onLogout, collapsed, onToggleCollapsed }) {
  const width = collapsed ? 76 : 240
  const role = { role: user?.role || 'READ_ONLY', permissions: user?.permissions || [] }

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
        borderRight: '1.5px solid rgba(30,91,184,0.10)',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        display: 'flex', flexDirection: 'column', zIndex: 50,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 14px 16px', borderBottom: '1.5px solid rgba(30,91,184,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(30,91,184,0.1)', overflow: 'hidden', flexShrink: 0,
        }}>
          <img src={logoPng} alt="TAOMAN" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: '#0F1E3D', lineHeight: 1.2 }}>TAOMAN</div>
              <div style={{ fontSize: 9, color: '#7A9CC9', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Group Investments</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? 'Étendre' : 'Réduire'}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#7A9CC9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.filter((item) => hasPerm(role, item.perm)).map(({ to, label, icon: Icon, badge }) => {
          const count = badge ? badges[badge] || 0 : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, marginBottom: 3, textDecoration: 'none', fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#1E5BB8' : '#3D5A99',
                background: isActive ? 'rgba(30,91,184,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid #1E5BB8' : '3px solid transparent',
                position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.18s',
              })}
            >
              <Icon size={18} strokeWidth={2} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {count > 0 && (
                <span style={{
                  background: '#E89B3C', color: '#fff', borderRadius: 20,
                  padding: '2px 7px', fontSize: 10, fontWeight: 700,
                  position: collapsed ? 'absolute' : 'static',
                  top: collapsed ? 4 : undefined,
                  right: collapsed ? 4 : undefined,
                }}>{count}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div style={{
        padding: '12px 14px',
        borderTop: '1.5px solid rgba(30,91,184,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 99,
          background: '#1E5BB8', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {(user?.name || 'A').charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, fontSize: 12, color: '#3D5A99', overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: 10, color: '#7A9CC9' }}>{user?.role}</div>
          </div>
        )}
        <button
          onClick={onLogout}
          title="Déconnexion"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A9CC9' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </motion.aside>
  )
}
