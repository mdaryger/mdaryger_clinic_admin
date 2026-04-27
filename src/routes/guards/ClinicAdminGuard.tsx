import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../pages/FullPageLoader';

export function ClinicAdminGuard() {
  const { isInitialized, isAuthenticated, isSuperAdmin, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  if (isBranchAdmin && location.pathname !== '/home') {
    return <Navigate to="/home" replace />;
  }

  if (!isClinicAdmin && !isBranchAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
