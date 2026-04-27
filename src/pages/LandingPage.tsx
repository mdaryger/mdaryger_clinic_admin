import { ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { useI18n } from '../i18n/useI18n';

export function LandingPage() {
  const { t } = useI18n();

  return (
    <section className="w-full max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">{t('landing.title')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {t('landing.description')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/login">
              <Button type="button">
                {t('landing.login')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/register">
              <Button type="button" variant="secondary">
                {t('landing.register')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3">
            {[
              t('landing.featureClinicProfiles'),
              t('landing.featureBranchOperations'),
              t('landing.featureDoctorSchedules'),
              t('landing.featureRequestWorkflows'),
            ].map((item) => (
              <div key={item} className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
