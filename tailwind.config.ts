import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────────
      // PALETA DE COLORES — re_line | inner & out
      // Definidos en openspec/specs/04_client_branding.md
      // REGLA: No inventar variaciones fuera de este esquema.
      // ─────────────────────────────────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: '#4a6063',   // Dark Teal — botones, acentos, fondos oscuros
          50:  '#eef3f3',
          100: '#d6e4e5',
          200: '#adc9cc',
          300: '#85aeb2',
          400: '#6a8d91',
          500: '#4a6063',       // Base
          600: '#3b4e50',
          700: '#2c3c3e',
          800: '#1d292b',
          900: '#0f1617',
        },
        secondary: {
          DEFAULT: '#ccdee0',   // Light Blue — fondos app, tarjetas, hover states
          50:  '#f5f9fa',
          100: '#eaf4f5',
          200: '#ccdee0',       // Base
          300: '#aec8cb',
          400: '#90b2b6',
          500: '#729ca1',
          600: '#5a7d81',
          700: '#445e61',
          800: '#2d3f41',
          900: '#172021',
        },
        dark: {
          DEFAULT: '#3f3f3e',   // Dark Charcoal — texto principal, encabezados
          50:  '#f5f5f5',
          100: '#e8e8e8',
          200: '#d0d0d0',
          300: '#a8a8a7',
          400: '#808080',
          500: '#5f5f5e',
          600: '#3f3f3e',       // Base
          700: '#2f2f2e',
          800: '#1f1f1e',
          900: '#0f0f0e',
        },
      },

      // ─────────────────────────────────────────────────────────────────
      // TIPOGRAFÍAS — re_line
      // Fuentes locales: se cargarán desde /public/fonts/ cuando los
      // assets estén disponibles (Fase de assets).
      // Por ahora se usan las CSS variables, con Georgia como fallback
      // editorial para Melodrama y system-ui para URW DIN.
      // ─────────────────────────────────────────────────────────────────
      fontFamily: {
        melodrama: ['var(--font-melodrama)', 'Georgia', 'serif'],
        urwdin:    ['var(--font-urwdin)', 'system-ui', 'sans-serif'],
        sans:      ['var(--font-urwdin)', 'system-ui', 'sans-serif'],
        serif:     ['var(--font-melodrama)', 'Georgia', 'serif'],
      },

      // ─────────────────────────────────────────────────────────────────
      // ESPACIADO Y CONTENEDORES
      // ─────────────────────────────────────────────────────────────────
      maxWidth: {
        'brand': '1200px',
      },

      // ─────────────────────────────────────────────────────────────────
      // ANIMACIONES — micro-interacciones sutiles
      // ─────────────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
