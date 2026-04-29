import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useI18n } from '../../i18n/useI18n';
import { getAdminUserById, type AdminUser } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';

function DetailItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value === undefined || value === null || value === '' ? '-' : String(value)}</p>
    </div>
  );
}

function formatRole(role: AdminUser['normalizedRole']): string {
  return role === 'clinic_branch_admin' ? 'Clinic branch admin' : 'Clinic admin';
}

function formatDate(value: unknown): string {
  if (!value) {
    return '-';
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === 'function') {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(timestampLike.toDate());
    }

    if (typeof timestampLike.seconds === 'number') {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestampLike.seconds * 1000));
    }
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
}

export function AdminUserDetailsPage() {
  const { t } = useI18n();
  const { userId } = useParams();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminUser = useCallback(async () => {
    if (!userId) {
      setError(t('adminUsers.missingId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adminUserData = await getAdminUserById(userId);

      if (adminUserData && clinicId && adminUserData.clinicId !== clinicId) {
        setAdminUser(null);
        setError(t('adminUsers.unavailableCurrentClinic'));
        return;
      }

      setAdminUser(adminUserData);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('adminUsers.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, userId, t]);

  useEffect(() => {
    void loadAdminUser();
  }, [loadAdminUser]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('adminUsers.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('adminUsers.loadFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadAdminUser()} />;
  }

  if (!adminUser) {
    return <ErrorState title={t('adminUsers.notFoundTitle')} description={t('adminUsers.notFoundDescription')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={adminUser.displayName || `${adminUser.firstName} ${adminUser.lastName}`.trim()}
        description={adminUser.normalizedRole === 'clinic_branch_admin' ? t('adminUsers.branchAdmin') : t('adminUsers.clinicAdmin')}
        actions={
          <Link to="/admin-users">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('adminUsers.back')}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ShieldCheck className="h-12 w-12" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{adminUser.displayName || `${adminUser.firstName} ${adminUser.lastName}`.trim()}</h2>
              <p className="mt-1 text-sm text-slate-600">{formatRole(adminUser.normalizedRole)}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge tone={adminUser.isActive ? 'green' : 'slate'}>{adminUser.isActive ? t('doctors.active') : t('doctors.inactive')}</Badge>
                <Badge tone={adminUser.isEmailVerified ? 'primary' : 'slate'}>{adminUser.isEmailVerified ? t('adminUsers.emailVerifiedYes') : t('adminUsers.emailVerifiedNo')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('adminUsers.contacts')}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">{t('adminUsers.email')}</p>
                  <p className="text-sm text-slate-600">{adminUser.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">{t('adminUsers.phone')}</p>
                  <p className="text-sm text-slate-600">{adminUser.phone || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('adminUsers.access')}</h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t('adminUsers.role')} value={adminUser.normalizedRole === 'clinic_branch_admin' ? t('adminUsers.branchAdmin') : t('adminUsers.clinicAdmin')} />
              <DetailItem label={t('adminUsers.clinicId')} value={adminUser.clinicId} />
              <DetailItem label={t('adminUsers.clinicBranchId')} value={adminUser.clinicBranchId} />
              <DetailItem label="UID" value={adminUser.uid} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('adminUsers.timeline')}</h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t('adminUsers.createdAt')} value={formatDate(adminUser.createdAt)} />
              <DetailItem label={t('adminUsers.updatedAt')} value={formatDate(adminUser.updatedAt)} />
              <DetailItem label={t('adminUsers.lastLoginAt')} value={formatDate(adminUser.lastLoginAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
