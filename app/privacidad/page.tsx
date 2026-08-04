import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de la plataforma re_line.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-secondary/30 py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-dark/50 hover:text-primary font-urwdin mb-10 transition-colors">
          ← Volver
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-10 space-y-8">
          <div className="border-b border-dark/8 pb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center mb-4">
              <span className="font-melodrama text-sm text-white">rl</span>
            </div>
            <h1 className="font-melodrama text-3xl text-dark">Política de Privacidad</h1>
            <p className="font-urwdin text-sm text-dark/40 mt-2">Última actualización: agosto 2025</p>
          </div>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">1. Responsable del tratamiento</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              eGrowth Labs S. de R.L. de C.V., con domicilio en México, es el responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">2. Datos que recopilamos</h2>
            <ul className="font-urwdin text-sm text-dark/70 leading-relaxed space-y-2 list-none">
              {[
                'Datos de identificación: nombre, correo electrónico, nombre de usuario.',
                'Datos de uso: clases vistas, sesiones de entrenamiento, progreso y estadísticas.',
                'Datos de pago: procesados directamente por Stripe. re_line no almacena datos de tarjetas.',
                'Datos técnicos: dirección IP, tipo de navegador, cookies de sesión.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">3. Finalidad del tratamiento</h2>
            <ul className="font-urwdin text-sm text-dark/70 leading-relaxed space-y-2 list-none">
              {[
                'Proveer acceso a la plataforma y gestionar tu suscripción.',
                'Personalizar tu experiencia y mostrar tu progreso.',
                'Enviarte notificaciones transaccionales (bienvenida, pagos, cambios en tu cuenta).',
                'Cumplir obligaciones legales y fiscales.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">4. Transferencia de datos</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Tus datos pueden ser compartidos con:
            </p>
            <ul className="font-urwdin text-sm text-dark/70 leading-relaxed space-y-2 list-none">
              {[
                'Stripe Inc. — procesamiento de pagos.',
                'SendGrid (Twilio) — envío de correos transaccionales.',
                'Amazon Web Services — almacenamiento de medios (videos e imágenes).',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              No vendemos ni cedemos tus datos a terceros con fines comerciales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">5. Cookies</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Usamos cookies estrictamente necesarias para mantener tu sesión activa. No usamos cookies de rastreo o publicidad de terceros en la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">6. Tus derechos (ARCO)</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales. Para ejercer estos derechos escríbenos a{' '}
              <a href="mailto:hola@egrowthlabs.mx" className="text-primary hover:underline">hola@egrowthlabs.mx</a>{' '}
              indicando el derecho que deseas ejercer. Responderemos en un plazo máximo de 20 días hábiles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">7. Retención de datos</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Conservamos tus datos mientras tu cuenta esté activa y por el tiempo necesario para cumplir obligaciones legales. Puedes solicitar la eliminación de tu cuenta en cualquier momento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">8. Seguridad</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado TLS en tránsito, tokens JWT con expiración, contraseñas con hash bcrypt, y acceso restringido por roles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">9. Cambios a esta política</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Podemos actualizar esta política ocasionalmente. Te notificaremos por correo electrónico ante cambios materiales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">10. Contacto</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Para cualquier consulta sobre privacidad:{' '}
              <a href="mailto:hola@egrowthlabs.mx" className="text-primary hover:underline">hola@egrowthlabs.mx</a>
            </p>
          </section>

          <div className="border-t border-dark/8 pt-6">
            <Link href="/terminos" className="font-urwdin text-sm text-primary hover:underline">
              Ver Términos y Condiciones →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
