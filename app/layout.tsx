import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/context/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  're_line | inner & out',
    template: '%s | re_line',
  },
  description:
    'Plataforma VOD de fitness re_line. Cardio consciente, fuerza estructurada, pilates reformer y más. your rutine. your life.',
  keywords: ['re_line', 'fitness', 'VOD', 'pilates', 'cardio', 'fuerza', 'workout', 'entrenamiento', 'México'],
  metadataBase: new URL('https://app.reline.mx'),
  robots: { index: false, follow: false }, // app privada — no indexar en buscadores
  icons: {
    icon:  '/images/logo-re-line-dark.png',
    apple: '/images/logo-re-line-dark.png',
  },
  openGraph: {
    title:       're_line | inner & out',
    description: 'your rutine. your life. Plataforma de fitness VOD.',
    siteName:    're_line',
    url:         'https://app.reline.mx',
    locale:      'es_MX',
    type:        'website',
    images: [
      {
        url:    'https://reline.mx/images/reline_betzy_entrenamiento-planche-terraza.jpeg',
        width:  1200,
        height: 630,
        alt:    're_line | inner & out — your rutine. your life.',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       're_line | inner & out',
    description: 'your rutine. your life. Plataforma de fitness VOD.',
    images:      ['https://reline.mx/images/reline_betzy_entrenamiento-planche-terraza.jpeg'],
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
