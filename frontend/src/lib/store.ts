import { create } from 'zustand';
import { api, tokenStore, getErrorMessage } from './api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  setUser: (u: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (u) => set({ user: u }),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = data.data;
      tokenStore.set(accessToken, refreshToken);
      set({ user });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      const { user, accessToken, refreshToken } = data.data;
      tokenStore.set(accessToken, refreshToken);
      set({ user });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    } finally {
      tokenStore.clear();
      set({ user: null });
    }
  },

  loadMe: async () => {
    const token = tokenStore.getAccess();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data });
    } catch {
      tokenStore.clear();
      set({ user: null });
    } finally {
      set({ initialized: true });
    }
  },
}));
