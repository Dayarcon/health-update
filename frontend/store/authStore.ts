import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'caregiver';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,

  setUser: (user) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    AsyncStorage.setItem('accessToken', accessToken);
    AsyncStorage.setItem('refreshToken', refreshToken);
  },

  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('accessToken');
    AsyncStorage.removeItem('refreshToken');
  },

  hydrate: async () => {
    try {
      const [user, accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
      ]);

      if (user && accessToken) {
        set({
          user: JSON.parse(user),
          accessToken,
          refreshToken,
        });
      }
    } catch (error) {
      console.error('Failed to hydrate auth store:', error);
    }
  },
}));
