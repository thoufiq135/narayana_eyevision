// ============================================================
//  STACKENZO EYE VISION – API CLIENT
//  Wraps fetch with auth headers, timeout, error handling.
//  Falls back to mock data when USE_MOCK = true.
// ============================================================

import { API_CONFIG } from './config';

// ── Toggle: true = use mock data, false = hit real API ─────
export const USE_MOCK = true;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export interface ApiError {
  status: number;
  message: string;
}

function getToken(): string | null {
  return localStorage.getItem(API_CONFIG.TOKEN_KEY);
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const token = getToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw { status: res.status, message: err.message ?? 'Request failed' } as ApiError;
    }

    return res.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as ApiError).status) throw err;
    throw { status: 0, message: 'Network error or request timed out' } as ApiError;
  }
}

// Convenience helpers
export const api = {
  get:    <T>(url: string, signal?: AbortSignal) => apiRequest<T>(url, { method: 'GET', signal }),
  post:   <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'POST', body }),
  put:    <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'PUT', body }),
  patch:  <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
