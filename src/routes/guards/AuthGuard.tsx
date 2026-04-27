import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../pages/FullPageLoader';

export function AuthGuard() {
  const { isInitialized, isAuthenticated } = useAuthStore();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
