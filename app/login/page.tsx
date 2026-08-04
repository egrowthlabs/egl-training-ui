'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [userName,     setUserName]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(userName, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center px-4">
      {/* Card */}
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

        {/* Heading */}
        <h1 className="font-melodrama text-2xl text-dark text-center mb-1">
          Bienvenid@
        </h1>
        <p className="text-sm text-dark/50 font-urwdin text-center mb-8">
          Inicia sesión para acceder a tu plataforma
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-dark mb-1.5 font-urwdin"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="tu.usuario"
              required
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-dark mb-1.5 font-urwdin"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-base pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-primary transition-colors"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600 font-urwdin">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-login"
            className="btn-primary w-full mt-2"
          >
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-dark/50 font-urwdin mt-4">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-primary hover:underline font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-dark/40 font-urwdin">
        re_line © {new Date().getFullYear()}. Todos los derechos reservados.
      </p>
    </div>
  );
}
