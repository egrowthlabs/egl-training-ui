'use client';

import { useAuth } from '@/context/auth-context';
import { ReactNode } from 'react';

interface ProtectedElementProps {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedElement({
  module,
  action,
  children,
  fallback = null,
}: ProtectedElementProps) {
  const { hasPermission } = useAuth();
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
}
