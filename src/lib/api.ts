import * as SecureStore from 'expo-secure-store';

// The backend URL comes from .env (EXPO_PUBLIC_ vars are baked into the app at build time).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'bh_token';

// The login token lives in the phone's secure storage (keychain / keystore), not in plain storage.
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

// Called when the server says 401 (expired or invalid session) so the app can go back to login.
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mobile', // tells the backend to return the login token in the JSON
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_URL}. Is the backend running and on the same Wi-Fi?`, 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, res.status, data?.error?.code);
  }
  return data as T;
}
