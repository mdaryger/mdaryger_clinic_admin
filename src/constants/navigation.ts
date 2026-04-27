import {
  Building2,
  ClipboardList,
  Home,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';

import { ROUTES } from './routes';

export const NAVIGATION_ITEMS = [
  {
    label: 'Home',
    path: ROUTES.home,
    icon: Home,
  },
  {
    label: 'Clinic Overview',
    path: ROUTES.clinicOverview,
    icon: LayoutDashboard,
  },
  {
    label: 'Branches',
    path: ROUTES.clinicBranches,
    icon: Building2,
  },
  {
    label: 'Doctors',
    path: ROUTES.clinicDoctors,
    icon: Stethoscope,
  },
  {
    label: 'Requests',
    path: ROUTES.clinicRequests,
    icon: ClipboardList,
  },
  {
    label: 'Admin Users',
    path: ROUTES.adminUsers,
    icon: Users,
  },
  {
    label: 'Settings',
    path: ROUTES.settings,
    icon: Settings,
  },
] as const;
