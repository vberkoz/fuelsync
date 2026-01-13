import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    idToken: null,
    accessToken: null,
    refreshToken: null,
    userEmail: null,
    
    setTokens: (idToken, accessToken, refreshToken) => {
      set({ idToken, accessToken, refreshToken });
    },
    
    setUserEmail: (email) => {
      set({ userEmail: email });
    },
    
    clearAuth: () => {
      set({ idToken: null, accessToken: null, refreshToken: null, userEmail: null });
    },
    
    isAuthenticated: () => {
      const storeToken = get().idToken;
      const localToken = localStorage.getItem('idToken');
      
      // Sync if localStorage has token but store doesn't
      if (!storeToken && localToken) {
        set({
          idToken: localToken,
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken'),
          userEmail: localStorage.getItem('userEmail')
        });
        return true;
      }
      
      return !!storeToken;
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      idToken: state.idToken,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      userEmail: state.userEmail
    })
  }
));
