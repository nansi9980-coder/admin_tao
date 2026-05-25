import { Search, Bell, Moon, Sun, Command as CmdIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { ROLE_LABELS } from '../utils/permissions'

export default function TopBar({ onSearchClick, onNotificationsClick, onToggleTheme, theme, notifCount = 0, user }) {
  const dark = theme === 'dark'
  return (
    <header style={{
      height: 64,
      borderBottom: '1px solid rgba(30,91,184,0.08)',
      background: dark ? 'rgba(15, 30, 61, 0.85)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <button
        onClick={onSearchClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(30,91,184,0.05)',
          border: '1px solid rgba(30,91,184,0.12)', borderRadius: 10,
          color: dark ? 'rgba(255,255,255,0.7)' : '#3D5A99', cursor: 'pointer',
          fontSize: 13, minWidth: 280, flex: 1, maxWidth: 420,
        }}
      >
        <Search size={16} />
        <span style={{ flex: 1, textAlign: 'left' }}>Rechercher (pages, investisseurs…)</span>
        <kbd style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 4,
          background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,30,61,0.05)',
          color: dark ? 'rgba(255,255,255,0.7)' : '#3D5A99',
          fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <CmdIcon size={10} /> K
        </kbd>
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={onToggleTheme}
        title={dark ? 'Mode clair' : 'Mode sombre'}
        style={{
          background: 'transparent', border: '1px solid rgba(30,91,184,0.12)',
          width: 38, height: 38, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: dark ? '#FAF7F2' : '#1E5BB8',
        }}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        onClick={onNotificationsClick}
        style={{
          position: 'relative', background: 'transparent',
          border: '1px solid rgba(30,91,184,0.12)',
          width: 38, height: 38, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: dark ? '#FAF7F2' : '#1E5BB8',
        }}
      >
        <Bell size={16} />
        {notifCount > 0 && (
          <motion.span
            key={notifCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18, padding: '0 4px',
              background: '#E89B3C', color: '#fff', borderRadius: 99,
              fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {notifCount > 9 ? '9+' : notifCount}
          </motion.span>
        )}
      </button>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(30,91,184,0.05)',
        borderRadius: 10, border: '1px solid rgba(30,91,184,0.08)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 99, background: '#1E5BB8', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800,
        }}>
          {(user?.name || 'A').charAt(0).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#fff' : '#0F1E3D' }}>{user?.name || 'Admin'}</span>
          <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.7)' : '#7A9CC9' }}>
            {ROLE_LABELS[user?.role] || user?.role || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
