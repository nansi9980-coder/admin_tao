import { AnimatePresence, motion } from 'framer-motion'
import { X, FileText, Wallet, ClipboardList, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ICON_FOR_TYPE = {
  document: FileText,
  finance: Wallet,
  'service-request': ClipboardList,
}

export default function NotificationDrawer({ open, onClose, items = [], onClickItem }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 30, 61, 0.4)',
            zIndex: 90,
          }}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: 'min(420px, 92vw)', background: 'var(--surface,#fff)',
              boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid rgba(30,91,184,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Bell size={18} color="#1E5BB8" />
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text,#0F1E3D)' }}>Notifications</h3>
              <span style={{
                marginLeft: 8, background: '#E89B3C', color: '#fff', borderRadius: 99,
                fontSize: 10, fontWeight: 800, padding: '2px 8px',
              }}>{items.length}</span>
              <button
                onClick={onClose}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7A9CC9' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {items.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#7A9CC9', fontSize: 13 }}>
                  Aucune notification
                </div>
              ) : (
                items.map((it, i) => {
                  const Ic = ICON_FOR_TYPE[it.type] || Bell
                  return (
                    <button
                      key={`${it.id || i}`}
                      onClick={() => { onClickItem?.(it); onClose() }}
                      style={{
                        display: 'flex', gap: 12, padding: 12, marginBottom: 8,
                        borderRadius: 10, background: 'rgba(30,91,184,0.04)',
                        border: '1px solid rgba(30,91,184,0.08)',
                        cursor: 'pointer', width: '100%', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 99, background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(30,91,184,0.1)',
                      }}>
                        <Ic size={16} color="#1E5BB8" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text,#0F1E3D)' }}>{it.title}</div>
                        <div style={{ fontSize: 12, color: '#5A6F94', marginTop: 2 }}>{it.body}</div>
                        {it.createdAt && (
                          <div style={{ fontSize: 10, color: '#7A9CC9', marginTop: 4 }}>
                            {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true, locale: fr })}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
