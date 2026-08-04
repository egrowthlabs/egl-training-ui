'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getUsers, createUser, deleteUser,
  updateUser, toggleUserLock, resetUserPassword,
} from '@/lib/api'
import type { User } from '@/lib/types'
import {
  Search, UserPlus, Trash2, Pencil, Lock, LockOpen,
  KeyRound, X, CheckCircle2, AlertTriangle, ChevronRight,
  Shield, Mail, User as UserIcon, BadgeCheck, Clock,
  MoreVertical, Eye, EyeOff, RefreshCw,
} from 'lucide-react'

// ── Role badge ─────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-purple-100 text-purple-700 border-purple-200',
  Admin:      'bg-primary/10 text-primary border-primary/20',
  Manager:    'bg-blue-100 text-blue-700 border-blue-200',
  Customer:   'bg-gray-100 text-gray-600 border-gray-200',
}
function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {role === 'SuperAdmin' && <Shield className="h-2.5 w-2.5" />}
      {role}
    </span>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="h-3 w-3" /> Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
      <Lock className="h-3 w-3" /> Bloqueado
    </span>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: { type: 'ok' | 'err'; text: string }; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-urwdin animate-fade-in
      ${msg.type === 'ok'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-700'}`}>
      {msg.type === 'ok'
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      {msg.text}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const ALL_ROLES = ['Customer', 'Admin', 'SuperAdmin', 'Manager']

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [form, setForm] = useState({
    firstName: user.fullName?.split(' ')[0] ?? '',
    lastName:  user.fullName?.split(' ').slice(1).join(' ') ?? '',
    email:     user.email,
    userName:  user.username,
    roles:     user.roles ?? ['Customer'],
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function toggleRole(role: string) {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.roles.length === 0) { setError('Asigna al menos un rol.'); return }
    setSaving(true); setError('')
    try {
      await updateUser(user.id, {
        userName:  form.userName,
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        roles:     form.roles,
      })
      onSaved('Usuario actualizado correctamente.')
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-melodrama text-sm text-primary">{user.fullName?.charAt(0) ?? user.username?.charAt(0) ?? '?'}</span>
            </div>
            <div>
              <h2 className="font-melodrama text-lg text-dark">Editar usuario</h2>
              <p className="text-xs text-dark/40 font-urwdin">@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Nombre</label>
              <input
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Apellido</label>
              <input
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">
              <Mail className="inline h-3 w-3 mr-1" />Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-base"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">
              <UserIcon className="inline h-3 w-3 mr-1" />Nombre de usuario
            </label>
            <input
              value={form.userName}
              onChange={e => setForm(p => ({ ...p, userName: e.target.value }))}
              className="input-base"
              required
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-2 font-urwdin">
              <Shield className="inline h-3 w-3 mr-1" />Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-urwdin border transition-all
                    ${form.roles.includes(role)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-dark/60 border-dark/15 hover:border-primary/40'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-urwdin">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset Password Modal ───────────────────────────────────────────────────────
function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: User
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [show,     setShow]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setSaving(true); setError('')
    try {
      await resetUserPassword(user.id, password)
      onSaved('Contraseña actualizada correctamente.')
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl"><KeyRound className="h-5 w-5 text-amber-600" /></div>
            <div>
              <h2 className="font-melodrama text-lg text-dark">Resetear contraseña</h2>
              <p className="text-xs text-dark/40 font-urwdin">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Nueva contraseña</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-base pr-10"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark/70">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Confirmar contraseña</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input-base"
              placeholder="Repetir contraseña"
              required
            />
          </div>

          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= i * 3
                      ? password.length >= 10 ? 'bg-green-500' : password.length >= 6 ? 'bg-amber-400' : 'bg-red-400'
                      : 'bg-dark/10'
                  }`} />
                ))}
              </div>
              <p className="text-xs font-urwdin text-dark/40">
                {password.length < 6 ? 'Demasiado corta' : password.length < 10 ? 'Aceptable' : 'Contraseña fuerte ✓'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-urwdin">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 bg-amber-500 hover:bg-amber-600 border-amber-500">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Create User Modal ──────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (msg: string) => void }) {
  const [form, setForm] = useState({ userName: '', firstName: '', lastName: '', email: '', password: '', roles: ['Customer'] })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createUser(form as any)
      onCreated('Usuario creado exitosamente.')
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><UserPlus className="h-5 w-5 text-primary" /></div>
            <h2 className="font-melodrama text-lg text-dark">Nuevo usuario</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/40"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Nombre</label>
              <input className="input-base" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Apellido</label>
              <input className="input-base" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Usuario</label>
            <input className="input-base" value={form.userName} onChange={e => setForm(p => ({ ...p, userName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Email</label>
            <input type="email" className="input-base" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-1.5 font-urwdin">Contraseña</label>
            <input type="password" className="input-base" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/60 mb-2 font-urwdin">Rol</label>
            <div className="flex gap-2">
              {ALL_ROLES.map(role => (
                <button key={role} type="button"
                  onClick={() => setForm(p => ({ ...p, roles: [role] }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-urwdin border transition-all
                    ${form.roles.includes(role) ? 'bg-primary text-white border-primary' : 'bg-white text-dark/60 border-dark/15 hover:border-primary/40'}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-urwdin">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
function ConfirmDeleteModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-xl"><Trash2 className="h-5 w-5 text-red-500" /></div>
          <h2 className="font-melodrama text-lg text-dark">Eliminar usuario</h2>
        </div>
        <p className="text-sm font-urwdin text-dark/60 mb-6">
          ¿Estás seguro de eliminar a <strong className="text-dark">{user.fullName ?? user.username}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-urwdin text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
type Modal = { type: 'edit' | 'password' | 'delete' | 'create'; user?: User }

export default function UsuariosPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState<Modal | null>(null)
  const [toast,   setToast]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)  // userId being actioned

  const showToast = (type: 'ok' | 'err', text: string) => setToast({ type, text })

  const load = useCallback(() => {
    setLoading(true)
    getUsers(1, 50, search)
      .then(res => {
        const list = res?.items ?? (Array.isArray(res) ? res : [])
        setUsers(list)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function handleToggleLock(user: User) {
    setActionLoading(user.id)
    try {
      const { message } = await toggleUserLock(user.id)
      showToast('ok', message)
      load()
    } catch (e: any) {
      showToast('err', e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(user: User) {
    setActionLoading(user.id)
    try {
      await deleteUser(user.id)
      showToast('ok', 'Usuario eliminado.')
      setModal(null)
      load()
    } catch (e: any) {
      showToast('err', e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const isLocked = (u: User) => !u.isActive

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Usuarios</h1>
          <p className="text-sm text-dark/50 font-urwdin mt-0.5">
            {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-dark/8 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 px-5 py-3 bg-secondary/30 border-b border-dark/8 text-xs font-urwdin font-medium text-dark/50 uppercase tracking-wider">
          <div className="w-10" />
          <div>Usuario</div>
          <div>Correo</div>
          <div>Rol</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="divide-y divide-dark/5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 px-5 py-4 items-center">
                <div className="w-10 h-10 rounded-full bg-secondary/60 animate-pulse" />
                <div className="h-3 bg-secondary/60 rounded-full w-32 animate-pulse" />
                <div className="h-3 bg-secondary/60 rounded-full w-40 animate-pulse" />
                <div className="h-5 bg-secondary/60 rounded-full w-16 animate-pulse" />
                <div className="h-5 bg-secondary/60 rounded-full w-16 animate-pulse" />
                <div className="h-5 bg-secondary/60 rounded-full w-24 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UserIcon className="h-10 w-10 text-dark/20 mx-auto mb-3" />
            <p className="font-melodrama text-dark/30">{search ? 'No se encontraron usuarios' : 'Sin usuarios'}</p>
          </div>
        ) : (
          <div className="divide-y divide-dark/5">
            {users.map(u => {
              const locked  = isLocked(u)
              const busy    = actionLoading === u.id
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 px-5 py-4 items-center transition-colors hover:bg-secondary/20
                    ${locked ? 'opacity-70' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0
                    ${locked ? 'bg-red-50' : 'bg-primary/10'}`}>
                    <span className={`font-melodrama text-sm ${locked ? 'text-red-400' : 'text-primary'}`}>
                      {(u.fullName ?? u.username)?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>

                  {/* Name + username */}
                  <div className="min-w-0">
                    <p className="font-urwdin text-sm font-medium text-dark truncate">
                      {u.fullName ?? u.username}
                    </p>
                    <p className="text-xs text-dark/40 font-urwdin">@{u.username}</p>
                  </div>

                  {/* Email */}
                  <div className="min-w-0">
                    <p className="text-sm font-urwdin text-dark/60 truncate">{u.email}</p>
                  </div>

                  {/* Roles */}
                  <div className="flex gap-1 flex-wrap">
                    {(u.roles ?? []).map(r => <RoleBadge key={r} role={r} />)}
                  </div>

                  {/* Status */}
                  <StatusBadge isActive={!locked} />

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    {/* Edit */}
                    <button
                      title="Editar usuario"
                      onClick={() => setModal({ type: 'edit', user: u })}
                      className="p-2 rounded-xl hover:bg-primary/10 text-dark/40 hover:text-primary transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Reset Password */}
                    <button
                      title="Cambiar contraseña"
                      onClick={() => setModal({ type: 'password', user: u })}
                      className="p-2 rounded-xl hover:bg-amber-50 text-dark/40 hover:text-amber-600 transition-colors"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>

                    {/* Lock / Unlock */}
                    <button
                      title={locked ? 'Desbloquear acceso' : 'Bloquear acceso'}
                      onClick={() => handleToggleLock(u)}
                      disabled={busy}
                      className={`p-2 rounded-xl transition-colors disabled:opacity-40
                        ${locked
                          ? 'hover:bg-green-50 text-red-400 hover:text-green-600'
                          : 'hover:bg-red-50 text-dark/40 hover:text-red-500'}`}
                    >
                      {busy
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : locked
                          ? <LockOpen className="h-4 w-4" />
                          : <Lock className="h-4 w-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      title="Eliminar usuario"
                      onClick={() => setModal({ type: 'delete', user: u })}
                      className="p-2 rounded-xl hover:bg-red-50 text-dark/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && (
        <CreateUserModal
          onClose={() => setModal(null)}
          onCreated={msg => { showToast('ok', msg); load() }}
        />
      )}
      {modal?.type === 'edit' && modal.user && (
        <EditUserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={msg => { showToast('ok', msg); load() }}
        />
      )}
      {modal?.type === 'password' && modal.user && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={msg => showToast('ok', msg)}
        />
      )}
      {modal?.type === 'delete' && modal.user && (
        <ConfirmDeleteModal
          user={modal.user}
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.user!)}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
