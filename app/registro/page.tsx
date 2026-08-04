'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { signup } from '@/lib/api/auth';

export default function RegistroPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    confirm:   '',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [error,        setError]          = useState('');
  const [success,      setSuccess]        = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center px-4">
      <div
        className="w-full max-w-md bg-white rounded-2xl px-8 py-10 animate-fade-in"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo-re-line-dark.png"
            alt="re_line | inner & out"
            width={140}
            height={48}
            className="object-contain"
            priority
          />
        </div>

        {success ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="font-melodrama text-2xl text-dark">¡Cuenta creada!</h2>
            <p className="text-dark/60 font-urwdin text-sm">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-melodrama text-2xl text-dark text-center mb-1">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-dark/50 font-urwdin text-center mb-8">
              Únete a re_line y transforma tu movimiento
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                    Nombre
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder="Ana"
                    required
                    className="input-base"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                    Apellido
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={set('lastName')}
                    placeholder="García"
                    required
                    className="input-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="ana@email.com"
                  required
                  className="input-base"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="input-base pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Repite tu contraseña"
                    required
                    className="input-base pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Requisitos de contraseña */}
              <ul className="text-xs text-dark/50 font-urwdin space-y-0.5 pl-1">
                <li className={form.password.length >= 8 ? 'text-green-600' : ''}>• Mínimo 8 caracteres</li>
                <li className={/[A-Z]/.test(form.password) ? 'text-green-600' : ''}>• Una letra mayúscula</li>
                <li className={/[0-9]/.test(form.password) ? 'text-green-600' : ''}>• Un número</li>
                <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-green-600' : ''}>• Un carácter especial (!@#$...)</li>
              </ul>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600 font-urwdin">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-2"
              >
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>

              <p className="text-center text-sm text-dark/50 font-urwdin">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-dark/40 font-urwdin">
        re_line © {new Date().getFullYear()}. Todos los derechos reservados.
      </p>
    </div>
  );
}
