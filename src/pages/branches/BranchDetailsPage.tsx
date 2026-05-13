import { ArrowLeft, CalendarClock, Mail, MapPin, Pencil, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useI18n } from '../../i18n/useI18n';
import { getBranchById, type ClinicBranch } from '../../services/branchService';
import { getBranchDashboardData } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

function DetailItem({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || t('branches.noData')}</p>
    </div>
  );
}

function getDoctorName(doctor: Record<string, unknown>, t: (key: string) => string): string {
  const name = typeof doctor.name === 'string' ? doctor.name : '';
  const firstName = typeof doctor.firstName === 'string' ? doctor.firstName : '';
  const lastName = typeof doctor.lastName === 'string' ? doctor.lastName : '';
  const fullName = `${name || firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return typeof doctor.displayName === 'string' && doctor.displayName.trim() ? doctor.displayName : t('doctors.doctor');
}

function formatWorkingDays(days: string[], t: (key: string) => string): string {
  if (!days.length) {
    return t('branches.noData');
  }

  return days.map((day) => t(`branches.${day}`)).join(', ');
}

function formatRequestType(requestType: string, t: (key: string) => string): string {
  if (requestType === 'home_visit_requests') {
    return t('nav.homeRequests');
  }

  if (requestType === 'clinic_visit_requests') {
    return t('nav.clinicVisitRequests');
  }

  if (requestType === 'home_visit_requests_plan') {
    return t('nav.plannedVisits');
  }

  return requestType;
}

export function BranchDetailsPage() {
  const { t } = useI18n();
  const { branchId } = useParams();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const [branch, setBranch] = useState<ClinicBranch | null>(null);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getBranchDashboardData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranchDetails = useCallback(async () => {
    if (!branchId) {
      setError(t('branches.missingId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const branchData = await getBranchById(branchId);

      if (!branchData) {
        setBranch(null);
        setDashboard(null);
        return;
      }

      if (clinicId && branchData.clinicId !== clinicId) {
        setBranch(null);
        setDashboard(null);
        setError(t('branches.unavailableCurrentClinic'));
        return;
      }

      setBranch(branchData);

      if (clinicId) {
        setDashboard(await getBranchDashboardData(clinicId, branchId));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('branches.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [branchId, clinicId, t]);

  useEffect(() => {
    void loadBranchDetails();
  }, [loadBranchDetails]);

  const requestSummary = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const counts = dashboard.requests.reduce<Record<string, number>>((accumulator, request) => {
      accumulator[request.requestType] = (accumulator[request.requestType] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts);
  }, [dashboard]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('branches.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('branches.loadFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadBranchDetails()} />;
  }

  if (!branch) {
    return <ErrorState title={t('branches.notFoundTitle')} description={t('branches.notFoundDescription')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={branch.name}
        description={[branch.city, branch.country].filter(Boolean).join(', ') || t('branches.detailsFallback')}
        actions={
          <>
            <Link to={`/clinic-branches/${branch.id}/edit`}>
              <Button type="button">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {t('branches.edit')}
              </Button>
            </Link>
            <Link to="/clinic-branches">
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('branches.back')}
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('branches.doctors')} value={dashboard?.totalDoctors ?? 0} icon={Stethoscope} helperText={t('branches.doctorsHelper')} />
        <StatCard label={t('branches.activeDoctors')} value={dashboard?.activeDoctors ?? 0} icon={ShieldCheck} helperText={t('branches.activeDoctorsHelper')} />
        <StatCard label={t('branches.availableDoctors')} value={dashboard?.availableDoctors ?? 0} icon={UserRound} helperText={t('branches.availableDoctorsHelper')} />
        <StatCard label={t('branches.activeRequests')} value={dashboard?.activeRequestsCount ?? 0} icon={CalendarClock} helperText={t('branches.activeRequestsHelper')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge tone={branch.isActive ? 'green' : 'slate'}>{branch.isActive ? t('branches.activeBadge') : t('branches.inactiveBadge')}</Badge>
                <Badge tone={branch.isMainBranch ? 'primary' : 'slate'}>{branch.isMainBranch ? t('branches.mainBadge') : t('branches.regularBadge')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t('branches.address')} value={branch.address} />
              <DetailItem label={t('branches.cityCountry')} value={[branch.city, branch.country].filter(Boolean).join(', ')} />
              {branch.isAroundTheClock ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">{t('branches.workingHours')}</p>
                  <div className="mt-1">
                    <Badge tone="green">{t('branches.aroundTheClock')}</Badge>
                  </div>
                </div>
              ) : (
                <>
                  <DetailItem label={t('branches.openingHours')} value={branch.openingHours || t('branches.noData')} />
                  <DetailItem label={t('branches.closingHours')} value={branch.closingHours || t('branches.noData')} />
                </>
              )}
              <DetailItem label={t('branches.description')} value={branch.description} />
              <DetailItem label={t('branches.workingDays')} value={formatWorkingDays(branch.workingDays, t)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('branches.relatedDoctors')}</h2>
            </CardHeader>
            <CardContent>
              {dashboard?.doctors.length ? (
                <div className="space-y-3">
                  {dashboard.doctors.slice(0, 6).map((doctor) => {
                    const specialist =
                      (typeof doctor.specialist === 'string' && doctor.specialist.trim()) ||
                      (typeof doctor.specialty === 'string' && doctor.specialty.trim()) ||
                      null;
                    const metaParts: string[] = [];
                    if (specialist) metaParts.push(specialist);
                    if (typeof doctor.experience === 'number' && doctor.experience > 0)
                      metaParts.push(`${doctor.experience} ${t('doctors.experienceYears')}`);
                    if (typeof doctor.price === 'number' && doctor.price > 0)
                      metaParts.push(`${doctor.price} ${t('doctors.currency')}`);

                    return (
                      <div key={doctor.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{getDoctorName(doctor, t)}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {metaParts.length ? metaParts.join(' · ') : t('branches.noData')}
                          </p>
                        </div>
                        <Badge tone={doctor.isActive ? 'green' : 'slate'}>
                          {doctor.isActive ? t('doctors.active') : t('doctors.inactive')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('branches.noDoctorsYet')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('branches.contacts')}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">{t('branches.phone')}</p>
                  <p className="text-sm text-slate-600">{branch.phone || t('branches.noData')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">{t('branches.email')}</p>
                  <p className="text-sm text-slate-600">{branch.email || t('branches.noData')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">{t('branches.website')}</p>
                  <p className="text-sm text-slate-600">{branch.website || t('branches.noData')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('branches.manager')}</h2>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailItem label={t('settings.name')} value={branch.branchManagerName} />
              <DetailItem label={t('branches.phone')} value={branch.branchManagerPhone} />
              <DetailItem label={t('branches.email')} value={branch.branchManagerEmail} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('branches.requestSummary')}</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t('branches.totalRequests')}</span>
                <span className="text-sm font-semibold text-slate-950">{dashboard?.requests.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t('branches.activeRequests')}</span>
                <span className="text-sm font-semibold text-slate-950">{dashboard?.activeRequestsCount ?? 0}</span>
              </div>
              {requestSummary.length ? (
                requestSummary.map(([requestType, count]) => (
                  <div key={requestType} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{formatRequestType(requestType, t)}</span>
                    <span className="text-sm font-semibold text-slate-950">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('branches.noRequestsYet')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
