import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, ArrowLeftRight, FileText, Wallet,
  TrendingUp, Image, ClipboardList, Briefcase, Shield, Settings, UserCog,
} from 'lucide-react'

const ITEMS = [
  { label: 'Tableau de bord', to: '/', icon: LayoutDashboard, perm: 'dashboard.view' },
  { label: 'Investisseurs', to: '/investors', icon: Users, perm: 'users.view' },
  { label: 'Souscriptions', to: '/subscriptions', icon: ArrowLeftRight, perm: 'subscriptions.view' },
  { label: 'Documents KYC', to: '/documents', icon: FileText, perm: 'kyc.view' },
  { label: 'Demandes de services', to: '/service-requests', icon: ClipboardList, perm: 'service-requests.view' },
  { label: 'Secteurs de services', to: '/service-sectors', icon: Briefcase, perm: 'sectors.view' },
  { label: 'Plans d\'investissement', to: '/plans', icon: TrendingUp, perm: 'plans.view' },
  { label: 'Bannières', to: '/banners', icon: Image, perm: 'banners.view' },
  { label: 'Finances', to: '/finance', icon: Wallet, perm: 'finance.view' },
  { label: 'Conformité / Audit', to: '/audit', icon: Shield, perm: 'audit.view' },
  { label: 'Administrateurs', to: '/admin-users', icon: UserCog, perm: 'admins.manage' },
  { label: 'Paramètres', to: '/settings', icon: Settings, perm: 'settings.view' },
]

import { hasPerm } from '../utils/permissions'

export default function CommandPalette({ open, onClose, role }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 30, 61, 0.5)',
            backdropFilter: 'blur(6px)', zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '12vh',
          }}
        >
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(580px, 90vw)',
              background: 'var(--surface, #fff)',
              borderRadius: 14,
              boxShadow: '0 28px 60px -10px rgba(15, 30, 61, 0.3)',
              overflow: 'hidden',
            }}
          >
            <Command label="Recherche">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(30,91,184,0.08)' }}>
                <Command.Input
                  placeholder="Rechercher une page, un investisseur, une action…"
                  autoFocus
                  style={{
                    width: '100%', padding: 8, fontSize: 15,
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text, #0F1E3D)',
                  }}
                />
              </div>
              <Command.List style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
                <Command.Empty style={{ padding: '20px 12px', color: '#7A9CC9', fontSize: 13 }}>
                  Aucun résultat
                </Command.Empty>
                <Command.Group heading="Navigation" style={{ fontSize: 11, color: '#7A9CC9', padding: '8px 12px 4px' }}>
                  {ITEMS.filter((i) => hasPerm(role, i.perm)).map((item) => (
                    <Command.Item
                      key={item.to}
                      value={item.label}
                      onSelect={() => { navigate(item.to); onClose() }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 14, color: 'var(--text, #0F1E3D)',
                      }}
                    >
                      <item.icon size={16} strokeWidth={2} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <kbd style={{ fontSize: 10, color: '#7A9CC9', background: 'rgba(30,91,184,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                        ↵
                      </kbd>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
              <div style={{
                padding: '8px 14px', borderTop: '1px solid rgba(30,91,184,0.08)',
                fontSize: 11, color: '#7A9CC9', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>↑↓ pour naviguer · ↵ pour valider</span>
                <span>esc pour fermer</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
