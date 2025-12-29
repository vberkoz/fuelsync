import { create } from 'zustand';

interface AuthState {
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  userEmail: string | null;
  setTokens: (idToken: string, accessToken: string, refreshToken: string) => void;
  setUserEmail: (email: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  idToken: localStorage.getItem('idToken'),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  userEmail: localStorage.getItem('userEmail'),
  
  setTokens: (idToken, accessToken, refreshToken) => {
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ idToken, accessToken, refreshToken });
  },
  
  setUserEmail: (email) => {
    localStorage.setItem('userEmail', email);
    set({ userEmail: email });
  },
  
  clearAuth: () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    set({ idToken: null, accessToken: null, refreshToken: null, userEmail: null });
  },
  
  isAuthenticated: () => !!get().idToken
}));
