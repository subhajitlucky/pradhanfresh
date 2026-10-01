import axios, { AxiosError, type AxiosInstance } from 'axios';

/* -------------------------------------------------------------------------- */
/*  Endpoints                                                                  */
/* -------------------------------------------------------------------------- */

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
export const API_BASE = `${API_ORIGIN}/api`;

const TOKEN_KEY = 'pf.token';

/* -------------------------------------------------------------------------- */
/*  Normalised errors                                                          */
/*                                                                            */
/*  The backend returns five different error shapes (see API_REFERENCE.md §2):  */
/*    1. { success:false, message, error }        4. { valid:false, ... }       */
/*    2. { success:false, message }              5. plain text (rate limiter)  */
/*    3. { error }                               (auth middleware)              */
/*  Everything funnels through `ApiError` so the UI has one thing to catch.     */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number;
  fields?: string[];
  details?: unknown;

  constructor(message: string, status: number, fields?: string[], details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.details = details;
  }

  get isAuth() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

function messageFrom(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    const candidates = [p.message, p.error, p.details];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c;
    }
  }
  return fallback;
}

const STATUS_TEXT: Record<number, string> = {
  0: 'Cannot reach the farm. Check your connection and try again.',
  400: 'That request was not valid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have access to this.',
  404: 'We could not find what you were looking for.',
  409: 'That already exists.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something broke on our side. Please try again.',
  503: 'That service is unavailable right now.',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<Record<string, unknown>>;
    const status = ax.response?.status ?? 0;
    const data = ax.response?.data;
    const fields = Array.isArray(data?.missingFields)
      ? (data.missingFields as string[])
      : undefined;
    const details = Array.isArray(data?.details) ? data.details : undefined;
    return new ApiError(
      messageFrom(data, STATUS_TEXT[status] ?? 'Something went wrong.'),
      status,
      fields,
      details,
    );
  }
  if (error instanceof Error) return new ApiError(error.message, 0);
  return new ApiError('Something went wrong.', 0);
}

/* -------------------------------------------------------------------------- */
/*  Client                                                                     */
/* -------------------------------------------------------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * On a 401 we try a silent refresh once, then retry the original request.
 * A single shared promise prevents a refresh stampede when several requests
 * 401 at once. If the refresh fails the session is cleared.
 */
let refreshing: Promise<boolean> | null = null;
const retryQueue = new Set<number>();

async function attemptRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const { data } = await axios.post<{ token?: string }>(
          `${API_BASE}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 10000 },
        );
        if (data?.token) {
          tokenStore.set(data.token);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        // Release the lock on the next tick so concurrent 401s all await it.
        setTimeout(() => {
          refreshing = null;
        }, 0);
      }
    })();
  }
  return refreshing;
}

let onSessionLost: (() => void) | null = null;
export function setSessionLostHandler(fn: (() => void) | null) {
  onSessionLost = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    const axError = error as AxiosError<Record<string, unknown>>;
    const status = axError.response?.status;
    const original = axError.config as (typeof axError.config & { _retried?: boolean }) | undefined;

    if (status === 401 && original && !original._retried && retryQueue.size < 20) {
      const isRefreshCall = original.url?.includes('/auth/refresh-token');
      if (!isRefreshCall) {
        original._retried = true;
        retryQueue.add(1);
        const ok = await attemptRefresh();
        retryQueue.delete(1);
        if (ok) return api.request(original);
        tokenStore.clear();
        onSessionLost?.();
      }
    }
    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a stored image path to something the browser can load.
 *
 * Two traps the backend sets:
 *  - `data.url` from /api/upload is root-relative (`/uploads/x.jpg`) and must
 *    be joined onto the API origin.
 *  - helmet's `crossOriginResourcePolicy: same-origin` blocks a cross-origin
 *    <img>, so every remote image is rendered with `crossOrigin="anonymous"`
 *    (see <ProseImage />).
 */
export function imageUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  if (path.startsWith('/src/') || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) return `${API_ORIGIN}${path}`;
  return path;
}

/** Unwraps the `{success, message, data}` envelope used by most routes. */
export async function unwrap<T>(p: Promise<{ data: { success?: boolean; data?: T } }>): Promise<T> {
  const res = await p;
  return res.data.data as T;
}
