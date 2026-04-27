import { LogOut, Menu } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { NAVIGATION_ITEMS } from '../constants/navigation';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

export function AppLayout() {
  const { firebaseUser, profile, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-lg font-semibold text-primary">Clinics Admin</span>
        </div>
        <nav className="space-y-1 p-4">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950',
                  isActive && 'bg-primary text-white hover:bg-primary hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Admin Panel</p>
              <h1 className="text-base font-semibold sm:text-lg">Clinics Admin Web</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {profile?.email ?? firebaseUser?.email ?? 'admin@clinics.local'}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
