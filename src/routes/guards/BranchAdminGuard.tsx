import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../pages/FullPageLoader';

export function BranchAdminGuard() {
  const { isInitialized, isAuthenticated, isSuperAdmin, isBranchAdmin } = useAuthStore();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  if (!isBranchAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
