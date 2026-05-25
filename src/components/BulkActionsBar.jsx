import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Barre flottante d'actions en masse — apparaît dès qu'un élément est sélectionné.
 *
 * @param {Object} props
 * @param {number} props.count - Nombre d'éléments sélectionnés.
 * @param {() => void} props.onClear - Désélectionner tout.
 * @param {Array<{ label: string, icon?: React.ReactNode, onClick: () => void, color?: string, danger?: boolean }>} props.actions
 */
export default function BulkActionsBar({ count, onClear, actions = [] }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, background: 'var(--surface)',
            boxShadow: '0 16px 40px rgba(15,30,61,0.18), 0 0 0 1px rgba(30,91,184,0.12)',
            borderRadius: 14, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            background: '#1E5BB8', color: '#fff', borderRadius: 99,
            padding: '4px 10px', fontSize: 12, fontWeight: 700,
          }}>
            {count} sélectionné{count > 1 ? 's' : ''}
          </div>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: a.danger ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: a.danger ? '#EF4444' : (a.color || 'var(--text)'),
                border: '1px solid transparent',
                fontSize: 13, fontWeight: 600, padding: '8px 12px',
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
          <button
            onClick={onClear}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', padding: 6, display: 'flex',
            }}
            title="Désélectionner"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
