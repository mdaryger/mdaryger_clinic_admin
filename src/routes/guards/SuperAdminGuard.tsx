import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../pages/FullPageLoader';

export function SuperAdminGuard() {
  const { isInitialized, isAuthenticated, isSuperAdmin } = useAuthStore();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
