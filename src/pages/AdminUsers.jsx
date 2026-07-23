import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Shield, Power, KeyRound, Edit3, Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminUsersService } from '../services/api'
import { ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_GROUPS } from '../utils/permissions'
import { Loading, EmptyState } from '../components/UI'

const ROLES = ['SUPER_ADMIN', 'DG', 'COMPLIANCE', 'MARKETING', 'FINANCE', 'SUPPORT', 'SERVICE_MANAGER', 'READ_ONLY']

const emptyForm = () => ({
  firstName: '', lastName: '', email: '', role: 'READ_ONLY', twoFactorRequired: true, permissions: [],
})

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [customizePerms, setCustomizePerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminUsersService.getAll()
      setUsers(Array.isArray(res) ? res : [])
    } catch (err) {
      toast.error('Impossible de charger les administrateurs')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const togglePerm = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const permissions = customizePerms ? form.permissions : []
    try {
      if (editing) {
        await adminUsersService.update(editing.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          twoFactorRequired: form.twoFactorRequired,
          permissions,
        })
        toast.success('Administrateur mis à jour')
      } else {
        const res = await adminUsersService.create({ ...form, permissions })
        if (res?.temporaryPassword) {
          setTempPassword({ email: form.email, password: res.temporaryPassword })
        }
        toast.success('Compte administrateur créé')
      }
      setShowForm(false)
      setEditing(null)
      setCustomizePerms(false)
      setForm(emptyForm())
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (u) => {
    try {
      if (u.active) await adminUsersService.disable(u.id)
      else await adminUsersService.enable(u.id)
      toast.success(u.active ? 'Désactivé' : 'Activé')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    }
  }

  const reset = async (u) => {
    if (!confirm(`Réinitialiser le mot de passe de ${u.email} ?`)) return
    try {
      const res = await adminUsersService.resetPassword(u.id)
      if (res?.temporaryPassword) {
        setTempPassword({ email: u.email, password: res.temporaryPassword })
      }
      toast.success('Mot de passe réinitialisé')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    }
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword.password)
      toast.success('Copié dans le presse-papier')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const forceChange = async (u) => {
    try {
      await adminUsersService.forcePasswordChange(u.id)
      toast.success('Changement de mot de passe requis à la prochaine connexion')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message)
    }
  }

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Shield size={22} color="#1E5BB8" />
        <h2 style={{ margin: 0, fontFamily: 'Sora', color: 'var(--text)' }}>Administrateurs</h2>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setEditing(null); setCustomizePerms(false); setForm(emptyForm()); setShowForm(true) }}
        >
          <Plus size={14} /> Nouvel administrateur
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="card"
          style={{ padding: 20, marginBottom: 20, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          <input className="input" placeholder="Prénom" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
          <input className="input" placeholder="Nom" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={Boolean(editing)} />
          <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={form.role === 'SUPER_ADMIN' && editing}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
            <input type="checkbox" checked={form.twoFactorRequired} onChange={e => setForm(f => ({ ...f, twoFactorRequired: e.target.checked }))} />
            Exiger l'activation de la 2FA
          </label>

          {form.role !== 'SUPER_ADMIN' && form.role !== 'DG' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" checked={customizePerms} onChange={e => setCustomizePerms(e.target.checked)} />
                Personnaliser précisément les accès (sinon : accès par défaut du rôle « {ROLE_LABELS[form.role]} »)
              </label>
              {customizePerms && (
                <div style={{
                  display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, 1fr)',
                  background: 'var(--surface-soft)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 16,
                }}>
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{group.label}</div>
                      {group.perms.map((p) => (
                        <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' }}>
                          <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditing(null) }}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Envoi…' : editing ? 'Enregistrer' : 'Créer & inviter'}</button>
          </div>
        </motion.form>
      )}

      <AnimatePresence>
        {tempPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
            }}
            onClick={() => setTempPassword(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="card"
              style={{ padding: 24, maxWidth: 440, width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <KeyRound size={20} color="#E89B3C" />
                <h3 style={{ margin: 0, fontFamily: 'Sora' }}>Mot de passe temporaire</h3>
                <button
                  onClick={() => setTempPassword(null)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ color: 'var(--text2)', margin: '0 0 14px', fontSize: 13 }}>
                Communiquez ce mot de passe à <strong style={{ color: 'var(--text)' }}>{tempPassword.email}</strong> par un canal sécurisé. Il sera demandé de le changer à la première connexion.
              </p>
              <div style={{
                background: 'var(--surface-soft)', border: '1px dashed var(--border)', padding: '14px 16px',
                borderRadius: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text)',
                letterSpacing: 1.5, textAlign: 'center', wordBreak: 'break-all',
              }}>
                {tempPassword.password}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setTempPassword(null)}>Fermer</button>
                <button className="btn btn-primary" onClick={copyPassword}>
                  <Copy size={14} /> Copier
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <Loading /> : users.length === 0 ? <EmptyState title="Aucun administrateur" /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {users.map((u) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, opacity: u.active ? 1 : 0.6 }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 99, background: '#1E5BB8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {(u.firstName || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.email}</div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: 'rgba(30,91,184,0.1)', color: '#1E5BB8',
              }}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
              {u.twoFactorRequired && (
                <span style={{ fontSize: 10, color: '#E89B3C', fontWeight: 700 }}>2FA requise</span>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => {
                setEditing(u)
                setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, twoFactorRequired: !!u.twoFactorRequired, permissions: u.permissions || [] })
                setCustomizePerms(Boolean(u.permissions?.length))
                setShowForm(true)
              }}>
                <Edit3 size={14} /> Modifier
              </button>
              <button className="btn btn-sm" onClick={() => reset(u)}>
                <KeyRound size={14} /> Reset
              </button>
              <button className="btn btn-sm" onClick={() => forceChange(u)}>Forcer changement</button>
              <button className="btn btn-sm" onClick={() => toggle(u)} style={{ color: u.active ? '#EF4444' : '#10B981' }}>
                <Power size={14} /> {u.active ? 'Désactiver' : 'Activer'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
