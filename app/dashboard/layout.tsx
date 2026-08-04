import { DashboardShell } from '@/components/dashboard-shell'
import { ToastProvider } from '@/context/toast-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  )
}
