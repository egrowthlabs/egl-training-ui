/**
 * app/page.tsx — Página raíz re_line
 * Redirige automáticamente al login.
 * En Fase 2 se añadirá el guard de autenticación en el dashboard layout.
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
