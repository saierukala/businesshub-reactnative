// Single fetch wrapper for the app. Errors from the API have the shape { error: { code, message, details } }
// and are thrown as ApiError, the same as on the web.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The backend URL comes from .env (EXPO_PUBLIC_ vars are baked into the app at build time).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'bh_token';

// The login token lives in the phone's secure storage (keychain / keystore), not in plain storage.
// (The browser preview has no secure store, so it falls back to localStorage. Web is for development only.)
const web = Platform.OS === 'web';
export const getToken = async () => (web ? localStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY));
export const saveToken = async (t: string) => (web ? localStorage.setItem(TOKEN_KEY, t) : SecureStore.setItemAsync(TOKEN_KEY, t));
export const clearToken = async () => (web ? localStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY));

export type FieldIssue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Validation errors from Zod on the backend: [{ path: "email", message: "..." }]
  get fieldIssues(): FieldIssue[] {
    return this.details.filter(
      (d): d is FieldIssue => typeof d === 'object' && d !== null && 'path' in d && 'message' in d,
    );
  }
}

// Called on a 401 (expired or invalid session) so the app can go back to the login screen.
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

type Options = { method?: string; body?: unknown };

// { q: "ravi", page: 2, customerId: undefined } -> "?q=ravi&page=2" (skips empty values)
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function api<T = unknown>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mobile', // tells the backend to return the login token in the JSON
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', `Can't reach the server. Check your connection and that the backend is running (${API_URL}).`);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) onUnauthorized();
    const e = data?.error;
    throw new ApiError(
      res.status,
      e?.code ?? 'UNKNOWN_ERROR',
      e?.message ?? 'Something went wrong. Please try again.',
      Array.isArray(e?.details) ? e.details : [],
    );
  }
  return data as T;
}
