import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ActivityFeed({ items = [], title = 'Activité en direct' }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 99, background: '#10B981',
          boxShadow: '0 0 0 4px rgba(16,185,129,0.18)',
          animation: 'pulse 1.6s ease-in-out infinite',
        }} />
        <h3 style={{ margin: 0, fontFamily: 'Sora', fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <Activity size={14} color="var(--text3)" style={{ marginLeft: 'auto' }} />
      </div>
      <AnimatePresence initial={false}>
        {items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}
          >
            En attente d'événements…
          </motion.div>
        ) : items.slice(0, 12).map((it, i) => (
          <motion.div
            key={`${it.id || i}-${it.createdAt || i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: i === 0 ? 'rgba(43,95,245,0.06)' : 'transparent',
              marginBottom: 4, display: 'flex', gap: 10,
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: 99, marginTop: 6,
              background: it.color || '#2B5FF5',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{it.title}</div>
              {it.body && <div style={{ color: 'var(--text2)', marginTop: 2 }}>{it.body}</div>}
              {it.createdAt && (
                <div style={{ color: 'var(--text3)', fontSize: 10, marginTop: 3 }}>
                  {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true, locale: fr })}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
