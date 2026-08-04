import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/context/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  're_line | inner & out',
    template: '%s | re_line',
  },
  description:
    'Plataforma VOD de fitness re_line. Cardio consciente, fuerza estructurada, pilates reformer y más. Tu rutina. Tu vida.',
  keywords: ['re_line', 'fitness', 'VOD', 'pilates', 'cardio', 'fuerza', 'workout', 'entrenamiento', 'México'],
  metadataBase: new URL('https://app.egrowthlabs.mx'),
  robots: { index: false, follow: false }, // app privada — no indexar
  openGraph: {
    title:       're_line | inner & out',
    description: 'Tu rutina. Tu vida. Plataforma de fitness VOD.',
    siteName:    're_line',
    locale:      'es_MX',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       're_line | inner & out',
    description: 'Tu rutina. Tu vida. Plataforma de fitness VOD.',
  },
}

export const viewport: Viewport = {
  themeColor:   '#4a6063',
  colorScheme:  'light',
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-MX">
      <body className="font-urwdin antialiased bg-secondary-50 text-dark">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
