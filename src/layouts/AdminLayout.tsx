import {
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  UserCog,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useI18n } from '../i18n/useI18n';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

type MenuItem = {
  labelKey: string;
  path: string;
  icon: typeof Home;
};

const superAdminMenu: MenuItem[] = [
  { labelKey: 'nav.clinics', path: '/super-admin', icon: Building2 },
];

const clinicAdminMenu: MenuItem[] = [
  { labelKey: 'nav.dashboard', path: '/home', icon: Home },
  { labelKey: 'nav.clinicOverview', path: '/clinic-overview', icon: LayoutDashboard },
  { labelKey: 'nav.branches', path: '/clinic-branches', icon: Building2 },
  { labelKey: 'nav.doctors', path: '/clinic-doctors', icon: Stethoscope },
  { labelKey: 'nav.homeRequests', path: '/clinic-requests', icon: ClipboardList },
  { labelKey: 'nav.clinicVisitRequests', path: '/clinic-visit-requests', icon: CalendarDays },
  { labelKey: 'nav.plannedVisits', path: '/home-visit-requests-plan', icon: CalendarDays },
  { labelKey: 'nav.adminUsers', path: '/admin-users', icon: UserCog },
  { labelKey: 'nav.settings', path: '/settings', icon: Settings },
];

const branchAdminMenu: MenuItem[] = [
  { labelKey: 'nav.dashboard', path: '/home', icon: Home },
  { labelKey: 'nav.branchOverview', path: '/branch-overview', icon: LayoutDashboard },
  { labelKey: 'nav.doctors', path: '/branch-doctors', icon: Stethoscope },
  { labelKey: 'nav.homeRequests', path: '/branch-home-requests', icon: ClipboardList },
  { labelKey: 'nav.clinicVisitRequests', path: '/branch-clinic-visit-requests', icon: CalendarDays },
  { labelKey: 'nav.plannedVisits', path: '/branch-home-visit-requests-plan', icon: CalendarDays },
];

function formatRole(role: string | null, t: (key: string) => string) {
  if (!role) {
    return t('common.admin');
  }

  return t(`roles.${role}`);
}

export function AdminLayout() {
  const { t, language, setLanguage } = useI18n();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { pathname } = useLocation();
  const { firebaseUser, profile, role, isSuperAdmin, isBranchAdmin, logout } = useAuthStore();
  const currentUserName =
    profile?.displayName ?? profile?.email ?? firebaseUser?.displayName ?? firebaseUser?.email ?? t('common.admin');

  const menuItems = useMemo(() => {
    if (isSuperAdmin) {
      return superAdminMenu;
    }

    if (isBranchAdmin) {
      return branchAdminMenu;
    }

    return clinicAdminMenu;
  }, [isBranchAdmin, isSuperAdmin]);

  const activeItem = menuItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div>
          <span className="block text-lg font-semibold text-primary">MDaryger</span>
          <span className="text-xs font-medium text-slate-500">{t('app.brandSubtitle')}</span>
        </div>
        <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} aria-label={t('common.closeNavigation')}>
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950',
                isActive && 'bg-primary text-white shadow-sm hover:bg-primary hover:text-white',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-950">{currentUserName}</p>
          <Badge tone={isSuperAdmin ? 'primary' : 'slate'} className="mt-2">
            {formatRole(role, t)}
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 lg:block">{sidebar}</aside>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t('common.closeNavigation')}
          />
          <aside className="relative h-full w-80 max-w-[86vw] border-r border-slate-200 shadow-xl">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)} aria-label={t('common.openNavigation')}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase text-slate-500">{t('app.adminPanel')}</p>
              <h1 className="truncate text-base font-semibold text-slate-950 sm:text-lg">
                {activeItem ? t(activeItem.labelKey) : t('app.appTitle')}
              </h1>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 sm:flex">
              <button
                type="button"
                className={cn('rounded px-2 py-1 text-xs font-semibold', language === 'ru' ? 'bg-primary text-white' : 'text-slate-600')}
                onClick={() => setLanguage('ru')}
              >
                RU
              </button>
              <button
                type="button"
                className={cn('rounded px-2 py-1 text-xs font-semibold', language === 'ky' ? 'bg-primary text-white' : 'text-slate-600')}
                onClick={() => setLanguage('ky')}
              >
                KY
              </button>
            </div>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-slate-950">{currentUserName}</p>
              <p className="text-xs text-slate-500">{formatRole(role, t)}</p>
            </div>
            <Button variant="secondary" size="icon" onClick={() => setIsLogoutConfirmOpen(true)} aria-label={t('common.logout')}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title={t('common.logoutTitle')}
        description={t('common.logoutDescription')}
        confirmLabel={t('common.logout')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void logout()}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
}
