import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  console.log('[PROTECTED_ROUTE] isAuthenticated:', isAuthenticated);
  console.log('[PROTECTED_ROUTE] localStorage tokens:', {
    accessToken: localStorage.getItem('accessToken') ? '***' : null,
    idToken: localStorage.getItem('idToken') ? '***' : null,
    refreshToken: localStorage.getItem('refreshToken') ? '***' : null
  });
  
  if (!isAuthenticated) {
    console.log('[PROTECTED_ROUTE] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[PROTECTED_ROUTE] Authenticated, rendering children');
  return <>{children}</>;
}
