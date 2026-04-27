import { Outlet } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../pages/FullPageLoader';
import { RoleRedirect } from '../RoleRedirect';

export function PublicOnlyGuard() {
  const { isInitialized, isAuthenticated } = useAuthStore();

  if (!isInitialized) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <RoleRedirect />;
  }

  return <Outlet />;
}
