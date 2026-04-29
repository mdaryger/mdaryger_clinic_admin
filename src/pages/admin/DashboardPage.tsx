import {
  Activity,
  Building2,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useI18n } from '../../i18n/useI18n';
import {
  asClinicRecord,
  getBranchDashboardData,
  getClinicDashboardData,
  type BranchDashboardData,
  type ClinicDashboardData,
  type DashboardRequest,
} from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

type DashboardState =
  | { kind: 'clinic'; data: ClinicDashboardData }
  | { kind: 'branch'; data: BranchDashboardData };

type ActivityTone = 'slate' | 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'teal';

function formatRole(role: string | null, t: (key: string) => string): string {
  if (!role) {
    return t('common.admin');
  }

  return t(`roles.${role}`);
}

function getGreetingName(profile: Record<string, unknown> | null): string {
  if (!profile) {
    return '';
  }

  const firstName = typeof profile.firstName === 'string' ? profile.firstName : '';
  const lastName = typeof profile.lastName === 'string' ? profile.lastName : '';
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  if (typeof profile.displayName === 'string' && profile.displayName.trim()) {
    return profile.displayName;
  }

  if (typeof profile.email === 'string' && profile.email.trim()) {
    return profile.email;
  }

  return '';
}

function getRequestTitle(request: DashboardRequest): string {
  const patientName = typeof request.patientName === 'string' ? request.patientName.trim() : '';
  const fullName = `${request.firstName ?? ''} ${request.lastName ?? ''}`.trim();

  if (patientName) {
    return patientName;
  }

  if (fullName) {
    return fullName;
  }

  return request.id;
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

function formatRequestStatus(status: string, t: (key: string) => string): string {
  const normalized = status.toLowerCase().replace(/_/g, '');
  const statusMap: Record<string, string> = {
    pending: t('requests.status.pending'),
    searching: t('requests.status.searching'),
    accepted: t('requests.status.accepted'),
    inprogress: t('requests.status.inProgress'),
    doctoronway: t('requests.status.doctorOnWay'),
    doctorarrived: t('requests.status.doctorArrived'),
    completed: t('requests.status.completed'),
    cancelled: t('requests.status.cancelled'),
    review: t('requests.status.review'),
    draft: t('requests.status.draft'),
    unknown: t('requests.status.unknown'),
  };

  return statusMap[normalized] ?? status;
}

function getRequestStatusTone(status?: string | null): ActivityTone {
  const normalized = String(status ?? '').toLowerCase().replace(/_/g, '');
  const toneMap: Record<string, ActivityTone> = {
    pending: 'yellow',
    searching: 'blue',
    accepted: 'primary',
    inprogress: 'orange',
    doctoronway: 'orange',
    doctorarrived: 'teal',
    completed: 'green',
    cancelled: 'red',
    review: 'blue',
    draft: 'slate',
  };

  return toneMap[normalized] ?? 'slate';
}

function formatDateTime(value: unknown, t: (key: string) => string): string {
  if (!value) {
    return t('dashboard.noDate');
  }

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  } else if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === 'function') {
      date = timestampLike.toDate();
    } else if (typeof timestampLike.seconds === 'number') {
      date = new Date(timestampLike.seconds * 1000);
    }
  }

  return date
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : t('dashboard.noDate');
}

function ActivityList({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    badgeLabel?: string;
    tone?: ActivityTone;
  }>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  {item.badgeLabel ? <Badge tone={item.tone ?? 'slate'}>{item.badgeLabel}</Badge> : null}
                  <p className={`text-xs text-slate-500 ${item.badgeLabel ? 'mt-2' : ''}`}>{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const { clinic, clinicBranchId, clinicId, profile, role, isBranchAdmin, isSuperAdmin } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clinicRecord = useMemo(() => asClinicRecord(clinic), [clinic]);

  const loadDashboard = useCallback(async () => {
    if (!clinicId) {
      setDashboard(null);
      setError(t('dashboard.clinicUnavailable'));
      setLoading(false);
      return;
    }

    if (isBranchAdmin && !clinicBranchId) {
      setDashboard(null);
      setError(t('dashboard.branchUnavailable'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isBranchAdmin && clinicBranchId) {
        const data = await getBranchDashboardData(clinicId, clinicBranchId);
        setDashboard({ kind: 'branch', data });
      } else {
        const data = await getClinicDashboardData(clinicId);
        setDashboard({ kind: 'clinic', data });
      }
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('dashboard.loadFailed');
      setDashboard(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clinicBranchId, clinicId, isBranchAdmin, t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    if (dashboard.kind === 'clinic') {
      return [
        { label: t('dashboard.totalDoctors'), value: dashboard.data.totalDoctors, icon: Stethoscope, helperText: t('dashboard.allClinicDoctors') },
        { label: t('dashboard.activeDoctors'), value: dashboard.data.activeDoctors, icon: ShieldCheck, helperText: t('dashboard.currentlyActiveProfiles') },
        { label: t('dashboard.activeRequests'), value: dashboard.data.activeRequestsCount, icon: Activity, helperText: t('dashboard.openRequestQueue') },
        { label: t('dashboard.totalBranches'), value: dashboard.data.totalBranches, icon: Building2, helperText: t('dashboard.clinicBranchNetwork') },
      ];
    }

    return [
      { label: t('dashboard.totalDoctors'), value: dashboard.data.totalDoctors, icon: Stethoscope, helperText: t('dashboard.doctorsInThisBranch') },
      { label: t('dashboard.activeDoctors'), value: dashboard.data.activeDoctors, icon: ShieldCheck, helperText: t('dashboard.currentlyActiveProfiles') },
      { label: t('dashboard.activeRequests'), value: dashboard.data.activeRequestsCount, icon: Activity, helperText: t('dashboard.requestsVisibleToThisBranch') },
      { label: t('dashboard.availableDoctors'), value: dashboard.data.availableDoctors, icon: UserRound, helperText: t('dashboard.readyToTakeRequests') },
    ];
  }, [dashboard, t]);

  const latestRequests = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.data.latestRequests.map((request) => ({
      id: request.id,
      title: getRequestTitle(request),
      subtitle: formatRequestType(request.requestType, t),
      meta: formatDateTime(request.updatedAt ?? request.createdAt, t),
      badgeLabel: request.status ? formatRequestStatus(request.status, t) : undefined,
      tone: getRequestStatusTone(request.status),
    }));
  }, [dashboard, t]);

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  if (loading) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('dashboard.unavailable')}
        description={error}
        actionLabel={t('common.retry')}
        onAction={() => void loadDashboard()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('dashboard.hello')}${getGreetingName(profile) ? `, ${getGreetingName(profile)}` : ''}`}
        description={
          clinicRecord
            ? `${formatRole(role, t)} • ${clinicRecord.name}`
            : `${formatRole(role, t)}`
        }
        actions={<Badge tone="primary">{formatRole(role, t)}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            helperText={stat.helperText}
          />
        ))}
      </div>

      <ActivityList title="Последние заявки" emptyLabel="Пока нет заявок." items={latestRequests} />
    </div>
  );
}
