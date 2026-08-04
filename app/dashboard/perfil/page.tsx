'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { User, Scale, Save, Loader2, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function getMyProfile(token: string) {
  const res = await fetch(`${API_URL}/api/me/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Error al cargar el perfil')
  return res.json()
}

async function updateMyProfile(
  token: string,
  data: { firstName: string; lastName: string; preferredWeightUnit: string }
) {
  const res = await fetch(`${API_URL}/api/me/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? 'Error al actualizar el perfil')
  }
}

export default function PerfilPage() {
  const { user } = useAuth()
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const token = localStorage.getItem('app-token')
    if (!token) return
    getMyProfile(token)
      .then(data => {
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName   ?? '')
        setWeightUnit(data.preferredWeightUnit ?? 'lbs')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!firstName.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(''); setSuccess(false)
    const token = localStorage.getItem('app-token') ?? ''
    try {
      await updateMyProfile(token, {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        preferredWeightUnit: weightUnit,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-melodrama text-3xl text-dark">Mi perfil</h1>
        <p className="text-dark/60 font-urwdin mt-1">Actualiza tu información personal</p>
      </div>

      {/* Avatar preview */}
      <div className="card flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="font-melodrama text-3xl text-white">{initials}</span>
        </div>
        <div>
          <p className="font-melodrama text-xl text-dark">{firstName || 'Tu'} {lastName || 'nombre'}</p>
          <p className="text-sm text-dark/50 font-urwdin">{user?.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-urwdin">
            {user?.roles?.[0] ?? 'Customer'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="card space-y-5">
        <h2 className="font-melodrama text-base text-dark flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Información personal
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 font-urwdin">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700 font-urwdin">Perfil actualizado correctamente</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Nombre</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Tu nombre" className="input-base w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Apellido</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Tu apellido" className="input-base w-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-2 font-urwdin flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Unidad de peso preferida
          </label>
          <div className="flex gap-3">
            {(['lbs', 'kg'] as const).map(u => (
              <button key={u} type="button" onClick={() => setWeightUnit(u)}
                className={`flex-1 py-2.5 rounded-xl border-2 font-urwdin text-sm font-semibold transition-all
                  ${weightUnit === u ? 'border-primary bg-primary/5 text-primary' : 'border-dark/15 text-dark/50 hover:border-primary/40'}`}>
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Account info — read only */}
      <div className="card space-y-3">
        <h2 className="font-melodrama text-base text-dark">Cuenta</h2>
        <div>
          <p className="text-xs text-dark/40 font-urwdin uppercase tracking-wider mb-1">Correo electrónico</p>
          <p className="text-sm text-dark font-urwdin">{user?.email ?? '—'}</p>
          <p className="text-xs text-dark/40 font-urwdin mt-0.5">Para cambiar tu correo contacta al soporte</p>
        </div>
        <div>
          <p className="text-xs text-dark/40 font-urwdin uppercase tracking-wider mb-1">Usuario</p>
          <p className="text-sm text-dark font-urwdin">@{user?.username ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
