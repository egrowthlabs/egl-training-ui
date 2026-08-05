'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, Shield, Zap, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { signup } from '@/lib/api/auth';
import { useAuth } from '@/context/auth-context';
import { createCheckoutSession } from '@/lib/api/stripe';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Plan = 'mensual' | 'trimestral' | 'anual';

const PLAN_INFO: Record<Plan, {
  label: string;
  price: string;
  period: string;
  savings?: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
}> = {
  mensual: {
    label:    'Mensual',
    price:    '$450',
    period:   '/ mes',
    color:    'var(--primary)',
    icon:     <Zap className="w-5 h-5" />,
    features: ['Acceso ilimitado a clases', 'Nuevo contenido cada semana', 'Cancela cuando quieras'],
  },
  trimestral: {
    label:    'Trimestral',
    price:    '$1,215',
    period:   '/ 3 meses',
    savings:  'Ahorras $135',
    color:    '#7c5cbf',
    icon:     <Calendar className="w-5 h-5" />,
    features: ['Todo lo del plan mensual', 'Precio preferencial', 'Acceso 3 meses completos'],
  },
  anual: {
    label:    'Anual',
    price:    '$4,320',
    period:   '/ año',
    savings:  'Ahorras $1,080',
    color:    '#c0842b',
    icon:     <Shield className="w-5 h-5" />,
    features: ['Todo lo del plan trimestral', 'Mejor precio por mes', 'Acceso 12 meses completos'],
  },
};

// ─── Componente interno (usa useSearchParams) ─────────────────────────────────
function RegisterFlow() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const rawPlan = searchParams.get('plan') ?? 'mensual';
  const plan: Plan = ['mensual', 'trimestral', 'anual'].includes(rawPlan)
    ? (rawPlan as Plan)
    : 'mensual';

  const canceled = searchParams.get('canceled') === 'true';
  const planInfo = PLAN_INFO[plan];

  // Form state
  const [step, setStep]               = useState<'form' | 'paying'>('form');
  const [form, setForm]               = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [error,        setError]        = useState(canceled ? 'El pago fue cancelado. Puedes intentarlo de nuevo.' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (form.password.length < 8)       { setError('La contraseña debe tener al menos 8 caracteres.'); return; }

    setIsSubmitting(true);
    setStep('paying');

    try {
      // 1. Crear cuenta
      await signup({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la cuenta.');
      setIsSubmitting(false);
      setStep('form');
      return;
    }

    try {
      // 2. Auto-login: el backend genera el username desde el email (parte antes del @, puntos → _)
      const derivedUsername = form.email.split('@')[0].toLowerCase().replace(/\./g, '_');
      await login(derivedUsername, form.password);
    } catch {
      // Login falló — redirigir al login manual con plan preservado
      setError('Cuenta creada. Inicia sesión para activar tu suscripción.');
      setIsSubmitting(false);
      setStep('form');
      setTimeout(() => router.push(`/login?redirect=/dashboard/suscripcion&plan=${plan}`), 2500);
      return;
    }

    try {
      // 3. Crear sesión de Stripe Checkout y redirigir
      const checkoutUrl = await createCheckoutSession(plan);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar el pago. Intenta desde tu dashboard.');
      setIsSubmitting(false);
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--light)' }}>

      {/* ── Panel izquierdo: resumen del plan ──────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 xl:p-14"
        style={{ background: 'var(--dark)' }}
      >
        {/* Logo */}
        <Image
          src="/images/logo-re-line-ligth.png"
          alt="re_line"
          width={120}
          height={42}
          className="object-contain"
          priority
        />

        {/* Plan card */}
        <div>
          <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-6">
            Plan seleccionado
          </p>

          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${planInfo.color}40` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="p-2 rounded-xl"
                style={{ background: `${planInfo.color}20`, color: planInfo.color }}
              >
                {planInfo.icon}
              </span>
              <div>
                <p className="text-white font-black text-lg leading-none">{planInfo.label}</p>
                {planInfo.savings && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: planInfo.color }}>
                    {planInfo.savings}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-white font-black text-4xl">{planInfo.price}</span>
              <span className="text-white/40 text-sm">{planInfo.period}</span>
            </div>

            <ul className="space-y-2">
              {planInfo.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: planInfo.color }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Switch plan links */}
          <p className="text-white/30 text-xs mb-2">¿Quieres otro plan?</p>
          <div className="flex gap-3 flex-wrap">
            {(['mensual', 'trimestral', 'anual'] as Plan[]).filter(p => p !== plan).map(p => (
              <Link
                key={p}
                href={`/register?plan=${p}`}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                {PLAN_INFO[p].label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs">
          re_line © {new Date().getFullYear()} · Pago seguro con Stripe
        </p>
      </div>

      {/* ── Panel derecho: formulario ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Image
            src="/images/logo-re-line-dark.png"
            alt="re_line"
            width={110}
            height={38}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-md">
          {/* Plan badge mobile */}
          <div
            className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: `${planInfo.color}15`, color: planInfo.color, border: `1px solid ${planInfo.color}30` }}
          >
            {planInfo.icon}
            Plan {planInfo.label} · {planInfo.price}{planInfo.period}
            {planInfo.savings && <span>· {planInfo.savings}</span>}
          </div>

          <h1 className="font-melodrama text-3xl text-dark mb-1">
            Crea tu cuenta
          </h1>
          <p className="text-sm text-dark/50 font-urwdin mb-8">
            Un paso para empezar tu transformación en re_line.
          </p>

          {/* Estado: procesando pago */}
          {step === 'paying' ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="font-melodrama text-xl text-dark">Preparando tu pago…</p>
              <p className="text-sm text-dark/50 font-urwdin">
                Serás redirigido a Stripe de forma segura.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                    Nombre
                  </label>
                  <input
                    id="firstName" type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="Ana" required className="input-base"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                    Apellido
                  </label>
                  <input
                    id="lastName" type="text" value={form.lastName} onChange={set('lastName')}
                    placeholder="García" required className="input-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Correo electrónico
                </label>
                <input
                  id="reg-email" type="email" value={form.email} onChange={set('email')}
                  placeholder="ana@email.com" required className="input-base"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    placeholder="Mínimo 8 caracteres" required className="input-base pr-11"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors"
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar */}
              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm} onChange={set('confirm')}
                    placeholder="Repite tu contraseña" required className="input-base pr-11"
                  />
                  <button
                    type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors"
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Requisitos */}
              <ul className="text-xs text-dark/50 font-urwdin space-y-0.5 pl-1">
                <li className={form.password.length >= 8      ? 'text-green-600' : ''}>• Mínimo 8 caracteres</li>
                <li className={/[A-Z]/.test(form.password)    ? 'text-green-600' : ''}>• Una letra mayúscula</li>
                <li className={/[0-9]/.test(form.password)    ? 'text-green-600' : ''}>• Un número</li>
                <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-green-600' : ''}>• Un carácter especial</li>
              </ul>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600 font-urwdin">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="btn-register-submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
                  : <>Crear cuenta e ir a pagar <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Seguridad */}
              <div className="flex items-center justify-center gap-2 text-xs text-dark/40 font-urwdin pt-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Pago 100% seguro con Stripe · Sin cargos hoy</span>
              </div>

              <p className="text-center text-sm text-dark/50 font-urwdin">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="mt-10 text-xs text-dark/30 font-urwdin">
          re_line © {new Date().getFullYear()} · Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper con Suspense (requerido por useSearchParams) ────────────────
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    }>
      <RegisterFlow />
    </Suspense>
  );
}
