import { Download, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { AdminUsersTable } from '../../features/admin-users/AdminUsersTable';
import { useI18n } from '../../i18n/useI18n';
import { getAdminUsersByClinicId, updateAdminStatus, type AdminUser } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate, formatFullName, formatRole } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

export function AdminUsersPage() {
  const { t } = useI18n();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminUserToDeactivate, setAdminUserToDeactivate] = useState<AdminUser | null>(null);

  const loadAdminUsers = useCallback(async () => {
    if (!clinicId) {
      setAdminUsers([]);
      setError(t('adminUsers.clinicUnavailable'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setAdminUsers(await getAdminUsersByClinicId(clinicId));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('adminUsers.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, t]);

  useEffect(() => {
    void loadAdminUsers();
  }, [loadAdminUsers]);

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter((adminUser) => {
      const matchesSearch = matchesSearchQuery(
        [formatFullName(adminUser), adminUser.displayName, adminUser.email, adminUser.phone],
        search,
      );
      const matchesRole = roleFilter === 'all' || adminUser.normalizedRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [adminUsers, roleFilter, search]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  async function handleToggleActive(adminUser: AdminUser) {
    if (adminUser.isActive) {
      setAdminUserToDeactivate(adminUser);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAdminStatus(adminUser.id, adminUser.role, !adminUser.isActive);
      showToast({ type: 'success', title: !adminUser.isActive ? t('adminUsers.activated') : t('adminUsers.deactivated') });
      await loadAdminUsers();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('adminUsers.updateFailed');
      showToast({ type: 'error', title: t('adminUsers.updateFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeactivate() {
    if (!adminUserToDeactivate) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAdminStatus(adminUserToDeactivate.id, adminUserToDeactivate.role, false);
      showToast({ type: 'success', title: t('adminUsers.deactivated') });
      setAdminUserToDeactivate(null);
      await loadAdminUsers();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('adminUsers.updateFailed');
      showToast({ type: 'error', title: t('adminUsers.updateFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleExportCsv() {
    exportToCsv(
      'admin-users.csv',
      filteredAdminUsers.map((adminUser) => ({
        [t('adminUsers.fullName')]: adminUser.displayName || formatFullName(adminUser),
        [t('adminUsers.email')]: adminUser.email,
        [t('adminUsers.phone')]: adminUser.phone,
        [t('adminUsers.role')]: formatRole(adminUser.normalizedRole),
        [t('adminUsers.active')]: adminUser.isActive ? t('adminUsers.yes') : t('adminUsers.no'),
        [t('adminUsers.emailVerified')]: adminUser.isEmailVerified ? t('adminUsers.yes') : t('adminUsers.no'),
        [t('adminUsers.createdAt')]: formatDate(adminUser.createdAt),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('adminUsers.pageTitle')}
        description={t('adminUsers.pageDescription')}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={filteredAdminUsers.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('adminUsers.export')}
            </Button>
            <Link to="/admin-users/create">
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('adminUsers.create')}
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} placeholder={t('adminUsers.searchPlaceholder')} />
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">{t('adminUsers.allRoles')}</option>
              <option value="clinic_admin">{t('adminUsers.clinicAdmin')}</option>
              <option value="clinic_branch_admin">{t('adminUsers.branchAdmin')}</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label={t('adminUsers.loading')} /> : null}
          {error ? <ErrorState title={t('adminUsers.loadFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadAdminUsers()} /> : null}
          {!isLoading && !error ? <AdminUsersTable adminUsers={filteredAdminUsers} onToggleActive={(adminUser) => void handleToggleActive(adminUser)} /> : null}
          {isSubmitting && !isLoading ? <p className="mt-4 text-sm text-slate-500">{t('adminUsers.updatingStatus')}</p> : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={adminUserToDeactivate !== null}
        title={t('adminUsers.deactivateConfirmTitle')}
        description={t('adminUsers.deactivateConfirmDescription', {
          name: adminUserToDeactivate?.displayName || `${adminUserToDeactivate?.firstName ?? ''} ${adminUserToDeactivate?.lastName ?? ''}`.trim(),
        })}
        confirmLabel={t('adminUsers.deactivateAdmin')}
        cancelLabel={t('common.cancel')}
        isLoading={isSubmitting}
        onConfirm={() => void handleConfirmDeactivate()}
        onCancel={() => setAdminUserToDeactivate(null)}
      />
    </div>
  );
}
