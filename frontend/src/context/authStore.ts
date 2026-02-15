import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User | null, token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => set({ user, token }),
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
