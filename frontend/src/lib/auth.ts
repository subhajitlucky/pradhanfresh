import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, ApiError, tokenStore } from './api';
import type { Role, User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authed' | 'anon';
  /** Set once the persisted session has been read back from storage. */
  hydrated: boolean;

  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
  hydrate: () => void;
}

/**
 * Single source of truth for the session.
 *
 * The old app kept two incompatible stores (a React context and a zustand
 * store) and never wrote the token to the key the axios layer read, so every
 * authenticated request 401'd. This store owns both, and `tokenStore` in
 * lib/api.ts is kept in sync inside `login`.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      status: 'idle',
      hydrated: false,

      login: async (email, password) => {
        set({ status: 'loading' });
        try {
          const { data } = await api.post<{ message: string; token: string; user: User }>(
            '/auth/login',
            { email: email.trim(), password },
          );
          tokenStore.set(data.token);
          set({ user: data.user, token: data.token, status: 'authed' });
          return data.user;
        } catch (err) {
          set({ status: 'anon' });
          throw new ApiError(
            err instanceof ApiError ? err.message : 'We could not sign you in.',
            err instanceof ApiError ? err.status : 0,
          );
        }
      },

      // Signup returns { message, user } with no token — the account must be
      // verified by email before it can log in.
      signup: async (name, email, password) => {
        set({ status: 'loading' });
        try {
          await api.post('/auth/signup', { name: name.trim(), email: email.trim(), password });
          set({ status: 'anon' });
        } catch (err) {
          set({ status: 'anon' });
          throw err instanceof ApiError ? err : new ApiError('Sign-up failed.', 0);
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // A failed logout must never block the local session teardown.
        }
        tokenStore.clear();
        set({ user: null, token: null, status: 'anon' });
      },

      setUser: (user) => set({ user }),

      refreshProfile: async () => {
        try {
          const { data } = await api.get<{ success: boolean; data: User }>('/auth/profile');
          set({ user: data.data });
        } catch {
          // Keep the cached user rather than blanking the UI on a flaky read.
        }
      },

      hydrate: () => {
        if (get().hydrated) return;
        const token = get().token ?? tokenStore.get();
        if (token && get().user) {
          tokenStore.set(token);
          set({ token, status: 'authed', hydrated: true });
          void get().refreshProfile();
        } else {
          set({ status: 'anon', hydrated: true });
        }
      },
    }),
    {
      name: 'pf-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token }) as AuthState,
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    },
  ),
);

/* -------------------------------------------------------------------------- */
/*  Derived helpers                                                            */
/* -------------------------------------------------------------------------- */

export const isAdmin = (user: User | null): boolean => user?.role === ('ADMIN' satisfies Role);

export function displayName(user: User | null): string {
  if (!user) return 'Guest';
  const first = user.name.trim().split(/\s+/)[0];
  return first || user.email.split('@')[0];
}

export function initials(user: User | null): string {
  if (!user) return 'G';
  return (
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'PF'
  );
}
