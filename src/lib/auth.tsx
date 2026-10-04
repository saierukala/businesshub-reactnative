import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, saveToken, setUnauthorizedHandler } from './api';

type User = { id: string; name: string; role: string };
type AuthState = {
  user: User | null;
  loading: boolean; // true while we check the stored token at app start
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const logout = useCallback(async () => {
    await clearToken();
    qc.clear(); // never show the previous user's cached data to the next login
    setUser(null);
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    // On start: if a token is stored, ask the server who it belongs to.
    (async () => {
      try {
        if (await getToken()) setUser((await api<{ user: User }>('/auth/me')).user);
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, [logout]);

  async function login(email: string, password: string) {
    const res = await api<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password } });
    // This app is for field technicians. Other roles use the web app.
    if (res.user.role !== 'TECHNICIAN') throw new Error('This app is for technicians. Please use the web app.');
    await saveToken(res.token);
    setUser(res.user);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
