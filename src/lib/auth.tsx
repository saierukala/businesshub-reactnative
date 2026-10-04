import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, saveToken, setUnauthorizedHandler } from './api';

export type Role = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER';

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
};

export const isStaff = (role: Role) => role === 'OWNER' || role === 'MANAGER';

// Where each role lands after login.
export function homeFor(role: Role): '/staff' | '/tech' | '/home' {
  if (isStaff(role)) return '/staff';
  if (role === 'TECHNICIAN') return '/tech';
  return '/home';
}

type AuthState = {
  user: User | null;
  loading: boolean; // true while we check the stored token at app start
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

type AuthResponse = { user: User; token?: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const logout = useCallback(async () => {
    await clearToken();
    qc.clear(); // never show the previous user's cached data to the next login
    setUser(null);
  }, [qc]);

  const refresh = useCallback(async () => {
    setUser((await api<{ user: User }>('/auth/me')).user);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    // On start: if a token is stored, ask the server who it belongs to.
    (async () => {
      try {
        if (await getToken()) await refresh();
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, [logout, refresh]);

  async function finish(res: AuthResponse) {
    if (!res.token) throw new Error('The server did not return a session. Is the backend up to date?');
    await saveToken(res.token);
    qc.clear();
    setUser(res.user);
    return res.user;
  }

  const login = async (email: string, password: string) =>
    finish(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }));

  const register = async (input: { name: string; email: string; phone?: string; password: string }) =>
    finish(await api<AuthResponse>('/auth/register', { method: 'POST', body: input }));

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
