'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, Shield, Zap, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { signup } from '@/lib/api/auth';
import { useAuth } from '@/context/auth-context';
import { createCheckoutSession } from '@/lib/api/stripe';

// ─── Colores de marca (hardcoded para evitar var() que no están definidas aquí) ──
const BRAND = {
  dark:    '#1a1a1a',
  teal:    '#4a7f7f',
  tealLt:  '#8ecece',
  light:   '#f7f5f2',
  white:   '#ffffff',
};

type Plan = 'mensual' | 'trimestral' | 'anual';

const PLAN_INFO: Record<Plan, {
  label: string;
  price: string;
  period: string;
  savings?: string;
  accentColor: string;
  icon: React.ReactNode;
  features: string[];
}> = {
  mensual: {
    label:       'Mensual',
    price:       '$450',
    period:      '/ mes',
    accentColor: '#8ecece',
    icon:        <Zap className="w-5 h-5" />,
    features:    ['Acceso ilimitado a clases', 'Nuevo contenido cada semana', 'Cancela cuando quieras'],
  },
  trimestral: {
    label:       'Trimestral',
    price:       '$1,215',
    period:      '/ 3 meses',
    savings:     'Ahorras $135 MXN',
    accentColor: '#b39ddb',
    icon:        <Calendar className="w-5 h-5" />,
    features:    ['Todo lo del plan mensual', 'Precio preferencial', 'Acceso 3 meses completos'],
  },
  anual: {
    label:       'Anual',
    price:       '$4,320',
    period:      '/ año',
    savings:     'Ahorras $1,080 MXN',
    accentColor: '#ffcc80',
    icon:        <Shield className="w-5 h-5" />,
    features:    ['Todo lo del plan trimestral', 'Mejor precio por mes', 'Acceso 12 meses completos'],
  },
};

function RegisterFlow() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const rawPlan = searchParams.get('plan') ?? 'mensual';
  const plan: Plan = ['mensual', 'trimestral', 'anual'].includes(rawPlan)
    ? (rawPlan as Plan) : 'mensual';

  const canceled = searchParams.get('canceled') === 'true';
  const info = PLAN_INFO[plan];

  const [step, setStep]             = useState<'form' | 'paying'>('form');
  const [form, setForm]             = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPwd,  setShowPwd]      = useState(false);
  const [showCfm,  setShowCfm]      = useState(false);
  const [error,    setError]        = useState(canceled ? 'El pago fue cancelado. Puedes intentarlo de nuevo.' : '');
  const [loading,  setLoading]      = useState(false);

  const set = (f: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (form.password.length < 8)       { setError('La contraseña debe tener al menos 8 caracteres.'); return; }

    setLoading(true);
    setStep('paying');

    try {
      await signup({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la cuenta.');
      setLoading(false); setStep('form'); return;
    }

    try {
      const derivedUsername = form.email.split('@')[0].toLowerCase().replace(/\./g, '_');
      await login(derivedUsername, form.password);
    } catch {
      setError('Cuenta creada. Inicia sesión para activar tu suscripción.');
      setLoading(false); setStep('form');
      setTimeout(() => router.push(`/login?redirect=/dashboard/suscripcion&plan=${plan}`), 2500);
      return;
    }

    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar el pago. Intenta desde tu dashboard.');
      setLoading(false); setStep('form');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: BRAND.light }}>

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-10 xl:p-14"
        style={{ background: BRAND.dark }}
      >
        {/* Logo */}
        <Image
          src="/images/logo-re-line-ligth.png"
          alt="re_line"
          width={120} height={42}
          className="object-contain"
          priority
        />

        {/* Plan card */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Plan seleccionado
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${info.accentColor}50`,
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            {/* Icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{
                padding: '0.5rem', borderRadius: '0.75rem',
                background: `${info.accentColor}25`, color: info.accentColor,
                display: 'flex',
              }}>
                {info.icon}
              </span>
              <div>
                <p style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{info.label}</p>
                {info.savings && (
                  <p style={{ color: info.accentColor, fontSize: '0.7rem', fontWeight: 700, marginTop: '0.25rem' }}>
                    {info.savings}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1 }}>{info.price}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>MXN {info.period}</span>
            </div>

            {/* Features */}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {info.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle style={{ width: '1rem', height: '1rem', flexShrink: 0, color: info.accentColor }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Switch plan */}
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginBottom: '0.5rem' }}>¿Quieres otro plan?</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['mensual', 'trimestral', 'anual'] as Plan[]).filter(p => p !== plan).map(p => (
              <Link
                key={p} href={`/register?plan=${p}`}
                style={{
                  fontSize: '0.72rem', padding: '0.35rem 0.75rem', borderRadius: '999px', fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                {PLAN_INFO[p].label}
              </Link>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
          re_line © {new Date().getFullYear()} · Pago seguro con Stripe
        </p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Image src="/images/logo-re-line-dark.png" alt="re_line" width={110} height={38} className="object-contain" priority />
        </div>

        <div className="w-full max-w-md">
          {/* Badge mobile */}
          <div
            className="lg:hidden inline-flex items-center gap-2 rounded-full text-xs font-bold mb-6 px-3 py-1.5"
            style={{ background: `${info.accentColor}20`, color: info.accentColor, border: `1px solid ${info.accentColor}40` }}
          >
            {info.icon}
            Plan {info.label} · {info.price} MXN{info.period}
          </div>

          <h1 className="font-melodrama text-3xl text-dark mb-1">Crea tu cuenta</h1>
          <p className="text-sm font-urwdin mb-8" style={{ color: 'rgba(63,63,62,0.5)' }}>
            Un paso para empezar tu transformación en re_line.
          </p>

          {step === 'paying' ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin" style={{ color: BRAND.teal }} />
              <p className="font-melodrama text-xl text-dark">Preparando tu pago…</p>
              <p className="text-sm font-urwdin" style={{ color: 'rgba(63,63,62,0.5)' }}>Serás redirigido a Stripe de forma segura.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Nombre</label>
                  <input id="firstName" type="text" value={form.firstName} onChange={set('firstName')} placeholder="Ana" required className="input-base" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Apellido</label>
                  <input id="lastName" type="text" value={form.lastName} onChange={set('lastName')} placeholder="García" required className="input-base" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Correo electrónico</label>
                <input id="reg-email" type="email" value={form.email} onChange={set('email')} placeholder="ana@email.com" required className="input-base" />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Contraseña</label>
                <div className="relative">
                  <input id="reg-password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" required className="input-base pr-11" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Confirmar contraseña</label>
                <div className="relative">
                  <input id="reg-confirm" type={showCfm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repite tu contraseña" required className="input-base pr-11" />
                  <button type="button" onClick={() => setShowCfm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors">
                    {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <ul className="text-xs font-urwdin space-y-0.5 pl-1" style={{ color: 'rgba(63,63,62,0.45)' }}>
                <li style={{ color: form.password.length >= 8       ? '#16a34a' : undefined }}>• Mínimo 8 caracteres</li>
                <li style={{ color: /[A-Z]/.test(form.password)     ? '#16a34a' : undefined }}>• Una letra mayúscula</li>
                <li style={{ color: /[0-9]/.test(form.password)     ? '#16a34a' : undefined }}>• Un número</li>
                <li style={{ color: /[^A-Za-z0-9]/.test(form.password) ? '#16a34a' : undefined }}>• Un carácter especial</li>
              </ul>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600 font-urwdin">{error}</p>
                </div>
              )}

              <button
                type="submit" id="btn-register-submit" disabled={loading}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
                  : <>Crear cuenta e ir a pagar <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              <div className="flex items-center justify-center gap-2 pt-1 font-urwdin" style={{ color: 'rgba(63,63,62,0.4)', fontSize: '0.72rem' }}>
                <Shield className="w-3.5 h-3.5" />
                <span>Pago 100% seguro con Stripe · Sin cargos hoy</span>
              </div>

              <p className="text-center text-sm font-urwdin" style={{ color: 'rgba(63,63,62,0.5)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: BRAND.teal }}>
                  Inicia sesión
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="mt-10 text-xs font-urwdin" style={{ color: 'rgba(63,63,62,0.3)' }}>
          re_line © {new Date().getFullYear()} · Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4a7f7f' }} />
      </div>
    }>
      <RegisterFlow />
    </Suspense>
  );
}
