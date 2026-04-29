import { Building2, CheckCircle2, Clock3, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useI18n } from '../../i18n/useI18n';
import { asClinicRecord, getClinicDashboardData, type ClinicDashboardData } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

function booleanTone(value: boolean): 'green' | 'slate' {
  return value ? 'green' : 'slate';
}

function booleanLabel(value: boolean, trueLabel: string, falseLabel: string): string {
  return value ? trueLabel : falseLabel;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value}</p>
    </div>
  );
}

export function ClinicOverviewPage() {
  const { t } = useI18n();
  const { clinic, clinicId } = useAuthStore();
  const [dashboard, setDashboard] = useState<ClinicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clinicRecord = useMemo(() => asClinicRecord(clinic), [clinic]);

  const loadOverview = useCallback(async () => {
    if (!clinicId) {
      setDashboard(null);
      setError(t('clinicOverview.clinicUnavailable'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getClinicDashboardData(clinicId);
      setDashboard(data);
    } catch (unknownError) {
      setDashboard(null);
      setError(unknownError instanceof Error ? unknownError.message : t('clinicOverview.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [clinicId, t]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading) {
    return <LoadingState label={t('clinicOverview.loading')} />;
  }

  if (error || !clinicRecord) {
    return (
      <ErrorState
        title={t('clinicOverview.unavailable')}
        description={error ?? t('clinicOverview.notFound')}
        actionLabel={t('clinicOverview.tryAgain')}
        onAction={() => void loadOverview()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={clinicRecord.name}
        description={t('clinicOverview.currentSnapshot')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={booleanTone(clinicRecord.isActive)}>
              {booleanLabel(clinicRecord.isActive, t('clinicOverview.active'), t('clinicOverview.inactive'))}
            </Badge>
            <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
              {booleanLabel(clinicRecord.isVerified, t('clinicOverview.verified'), t('clinicOverview.unverified'))}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('clinicOverview.branches')} value={dashboard?.totalBranches ?? 0} icon={Building2} helperText={t('clinicOverview.branchesHelper')} />
        <StatCard label={t('clinicOverview.doctors')} value={dashboard?.totalDoctors ?? 0} icon={UserRound} helperText={t('clinicOverview.doctorsHelper')} />
        <StatCard label={t('clinicOverview.activeDoctors')} value={dashboard?.activeDoctors ?? 0} icon={ShieldCheck} helperText={t('clinicOverview.activeDoctorsHelper')} />
        <StatCard label={t('clinicOverview.activeRequests')} value={dashboard?.activeRequestsCount ?? 0} icon={CheckCircle2} helperText={t('clinicOverview.activeRequestsHelper')} />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">{t('clinicOverview.clinicDetails')}</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label={t('clinicOverview.description')} value={clinicRecord.description || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.address')} value={clinicRecord.address || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.cityCountry')} value={[clinicRecord.city, clinicRecord.country].filter(Boolean).join(', ') || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.workingHours')} value={clinicRecord.workingHours || t('clinicOverview.notSpecified')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">{t('clinicOverview.contacts')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">{t('clinicOverview.phone')}</p>
                <p className="text-sm text-slate-600">{clinicRecord.phone || t('clinicOverview.notSpecified')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">{t('clinicOverview.email')}</p>
                <p className="text-sm text-slate-600">{clinicRecord.email || t('clinicOverview.notSpecified')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">{t('clinicOverview.address')}</p>
                <p className="text-sm text-slate-600">{clinicRecord.address || t('clinicOverview.notSpecified')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">{t('clinicOverview.workingHours')}</p>
                <p className="text-sm text-slate-600">{clinicRecord.workingHours || t('clinicOverview.notSpecified')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">{t('clinicOverview.contactPerson')}</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label={t('clinicOverview.name')} value={clinicRecord.contactPersonName || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.phone')} value={clinicRecord.contactPersonPhone || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.email')} value={clinicRecord.contactPersonEmail || t('clinicOverview.notSpecified')} />
            <DetailItem label={t('clinicOverview.website')} value={clinicRecord.website || t('clinicOverview.notSpecified')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">{t('clinicOverview.capabilities')}</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge tone={booleanTone(clinicRecord.isProcedureRoom)}>
              {booleanLabel(clinicRecord.isProcedureRoom, t('clinicOverview.procedureRoomAvailable'), t('clinicOverview.noProcedureRoom'))}
            </Badge>
            <Badge tone={booleanTone(clinicRecord.isTraumaCenter)}>
              {booleanLabel(clinicRecord.isTraumaCenter, t('clinicOverview.traumaCenter'), t('clinicOverview.noTraumaCenter'))}
            </Badge>
            <Badge tone={booleanTone(clinicRecord.isActive)}>
              {booleanLabel(clinicRecord.isActive, t('clinicOverview.clinicIsActive'), t('clinicOverview.clinicIsInactive'))}
            </Badge>
            <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
              {booleanLabel(clinicRecord.isVerified, t('clinicOverview.clinicVerified'), t('clinicOverview.clinicNotVerified'))}
            </Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
