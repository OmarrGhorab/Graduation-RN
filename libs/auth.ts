import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
}

// Store reference to query client for cache clearing
let queryClientRef: any = null;

export const setQueryClientRef = (queryClient: any) => {
    queryClientRef = queryClient;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: !!accessToken }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            updateUser: (user) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...user } : null,
                })),
            logout: () => {
                // Clear React Query cache on logout
                if (queryClientRef) {
                    console.log('[Auth] Clearing React Query cache on logout');
                    queryClientRef.clear();
                }
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
