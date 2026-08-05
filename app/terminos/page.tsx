import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma re_line.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-secondary/30 py-16 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back nav */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-dark/50 hover:text-primary font-urwdin mb-10 transition-colors">
          ← Volver
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-dark/8 pb-6">
            <Image
              src="/images/logo-re-line-dark.png"
              alt="re_line inner & out"
              width={120}
              height={40}
              className="h-10 w-auto object-contain mb-4"
            />
            <h1 className="font-melodrama text-3xl text-dark">Términos y Condiciones</h1>
            <p className="font-urwdin text-sm text-dark/40 mt-2">Última actualización: agosto 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">1. Aceptación de los términos</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Al acceder y usar la plataforma re_line (en adelante &ldquo;la Plataforma&rdquo;), con dominio reline.mx, aceptas los presentes Términos y Condiciones. Si no estás de acuerdo, te pedimos no usar la Plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">2. Descripción del servicio</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              re_line es una plataforma de video on demand (VOD) de fitness que ofrece clases de cardio consciente, fuerza estructurada, resistencia funcional y pilates reformer. El acceso al contenido premium requiere una suscripción activa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">3. Cuenta de usuario</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Para usar la Plataforma debes crear una cuenta con información verídica. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">4. Suscripciones y pagos</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Las suscripciones se cobran de forma mensual o anual según el plan elegido. Los pagos se procesan a través de Stripe. Al activar tu suscripción aceptas que se renueve automáticamente al final de cada período hasta que la canceles. Los precios pueden cambiar con previo aviso de 30 días.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">5. Período de prueba</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Ofrecemos 7 días de prueba gratuita al activar tu primera suscripción. Al finalizar el período de prueba se cobrará el primer pago automáticamente. Puedes cancelar antes de que termine la prueba sin cargo alguno.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">6. Cancelaciones y reembolsos</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Puedes cancelar tu suscripción en cualquier momento desde la sección &ldquo;Mi Suscripción&rdquo; en la Plataforma. Tu acceso continuará hasta el final del período pagado. No ofrecemos reembolsos por períodos parciales, salvo en casos donde la ley aplicable lo exija.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">7. Uso aceptable</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              El contenido de la Plataforma es para uso personal. Queda prohibido compartir tu cuenta, reproducir, distribuir, modificar o crear obras derivadas del contenido sin autorización expresa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">8. Limitación de responsabilidad</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              re_line proporciona contenido de fitness con fines informativos. Consulta a un profesional de salud antes de iniciar cualquier programa de ejercicio. No somos responsables por lesiones derivadas del uso del contenido.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">9. Modificaciones</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos mediante correo electrónico con al menos 15 días de anticipación ante cambios materiales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-melodrama text-lg text-dark">10. Contacto</h2>
            <p className="font-urwdin text-sm text-dark/70 leading-relaxed">
              Para cualquier duda escríbenos a{' '}
              <a href="mailto:hola@reline.mx" className="text-primary hover:underline">hola@reline.mx</a>.
            </p>
          </section>

          <div className="border-t border-dark/8 pt-6">
            <Link href="/privacidad" className="font-urwdin text-sm text-primary hover:underline">
              Ver Política de Privacidad →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
