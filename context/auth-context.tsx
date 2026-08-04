'use client';

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session on mount
  useEffect(() => {
    const token = localStorage.getItem('app-token');
    if (token) {
      fetchUserInfo(token)
        .catch(() => localStorage.removeItem('app-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-logout por inactividad (30 minutos)
  useEffect(() => {
    if (!user) return;
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { logout(); }, 1_800_000);
    };

    resetTimer();
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchUserInfo(token: string) {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
    });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    setUser({
      id:          data.id,
      username:    data.username,
      email:       data.email,
      fullName:    data.fullName,
      roles:       data.roles ?? [],
      permissions: data.permissions ?? [],
      isActive:    data.isActive,
    });
  }

  async function login(userName: string, password: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userName, password }),
      });
      if (!res.ok) throw new Error('Credenciales incorrectas');
      const { token } = await res.json();
      if (!token) throw new Error('Error al iniciar sesión');
      localStorage.setItem('app-token', token);
      await fetchUserInfo(token);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      const token = localStorage.getItem('app-token');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
          },
        });
      }
    } finally {
      localStorage.removeItem('app-token');
      setUser(null);
      router.push('/login');
    }
  }

  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (!user) return false;
      if (user.roles.includes('Admin')) return true;
      return user.permissions.includes(`${module}.${action}`);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
