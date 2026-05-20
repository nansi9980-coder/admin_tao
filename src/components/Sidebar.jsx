import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ArrowLeftRight, FileText, Wallet,
  Settings, LogOut, TrendingUp, Shield, Image,
} from 'lucide-react'
import logoPng from '../assets/logo.png'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/investors', label: 'Investisseurs', icon: Users },
  { to: '/subscriptions', label: 'Souscriptions', icon: ArrowLeftRight },
  { to: '/documents', label: 'Documents KYC', icon: FileText, badge: 'docs' },
  { to: '/plans', label: 'Plans', icon: TrendingUp },
  { to: '/banners', label: 'Bannières', icon: Image },
  { to: '/finance', label: 'Finances', icon: Wallet, badge: 'finance' },
  { to: '/audit', label: 'Conformité', icon: Shield },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

export default function Sidebar({ badges = {}, user, onLogout }) {
  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
      borderRight: '1.5px solid rgba(30,91,184,0.10)',
      height: '100vh', position: 'fixed', left: 0, top: 0,
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      <div style={{ padding: '22px 20px 18px', borderBottom: '1.5px solid rgba(30,91,184,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(30,91,184,0.1)', overflow: 'hidden',
          }}>
            <img src={logoPng} alt="TAOMAN" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 17, color: '#0F1E3D' }}>TAOMAN</div>
            <div style={{ fontSize: 10, color: '#7A9CC9', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Portal</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon: Icon, badge }) => {
          const count = badge ? badges[badge] || 0 : 0
          return (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, marginBottom: 3, textDecoration: 'none', fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#1E5BB8' : '#3D5A99',
              background: isActive ? 'rgba(30,91,184,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #1E5BB8' : '3px solid transparent',
            })}>
              <Icon size={18} strokeWidth={2} />
              <span style={{ flex: 1 }}>{label}</span>
              {count > 0 && (
                <span style={{
                  background: '#E89B3C', color: '#fff', borderRadius: 20,
                  padding: '2px 8px', fontSize: 10, fontWeight: 700,
                }}>{count}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div style={{ padding: '12px 14px', borderTop: '1.5px solid rgba(30,91,184,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#3D5A99' }}>
          <div style={{ fontWeight: 600 }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: 10, color: '#7A9CC9' }}>{user?.role}</div>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A9CC9' }}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
