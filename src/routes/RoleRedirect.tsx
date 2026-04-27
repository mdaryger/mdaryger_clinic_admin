import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { FullPageLoader } from './pages/FullPageLoader';

export function RoleRedirect() {
  const { isInitialized, isAuthenticated, isSuperAdmin } = useAuthStore();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  return <Navigate to="/home" replace />;
}
