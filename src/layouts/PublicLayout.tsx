import { Outlet } from 'react-router-dom';

import { useI18n } from '../i18n/useI18n';
import { cn } from '../utils/cn';

export function PublicLayout() {
  const { language, setLanguage } = useI18n();

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_52%,_#f8fafc_100%)]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,_rgba(255,255,255,0.72),_transparent)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">Medicall Clinics</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Админ-панель клиник</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Удобный вход и регистрация для администраторов клиник в одном аккуратном интерфейсе.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/85 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <button
              type="button"
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                  language === 'ru' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                )}
              onClick={() => setLanguage('ru')}
            >
              RU
            </button>
            <button
              type="button"
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                  language === 'ky' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                )}
              onClick={() => setLanguage('ky')}
            >
              KY
            </button>
          </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-2 sm:py-4">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
