import { Download, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { AdminUsersTable } from '../../features/admin-users/AdminUsersTable';
import { getAdminUsersByClinicId, updateAdminStatus, type AdminUser } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate, formatFullName, formatRole } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

export function AdminUsersPage() {
  const { clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminUsers = useCallback(async () => {
    if (!clinicId) {
      setAdminUsers([]);
      setError('Clinic is not available for this user.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setAdminUsers(await getAdminUsersByClinicId(clinicId));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load admin users.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

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
    setIsSubmitting(true);

    try {
      await updateAdminStatus(adminUser.id, adminUser.role, !adminUser.isActive);
      showToast({ type: 'success', title: !adminUser.isActive ? 'Admin user activated' : 'Admin user deactivated' });
      await loadAdminUsers();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to update admin user status.';
      showToast({ type: 'error', title: 'Update failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleExportCsv() {
    exportToCsv(
      'admin-users.csv',
      filteredAdminUsers.map((adminUser) => ({
        'Full Name': adminUser.displayName || formatFullName(adminUser),
        Email: adminUser.email,
        Phone: adminUser.phone,
        Role: formatRole(adminUser.normalizedRole),
        Active: adminUser.isActive ? 'Yes' : 'No',
        'Email Verified': adminUser.isEmailVerified ? 'Yes' : 'No',
        'Created At': formatDate(adminUser.createdAt),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin users"
        description="Manage clinic admins and branch admins for the current clinic."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={filteredAdminUsers.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <Link to="/admin-users/create">
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create admin
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} placeholder="Search by name, email, or phone" />
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="clinic_admin">Clinic admin</option>
              <option value="clinic_branch_admin">Clinic branch admin</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label="Loading admin users..." /> : null}
          {error ? <ErrorState title="Unable to load admin users" description={error} actionLabel="Retry" onAction={() => void loadAdminUsers()} /> : null}
          {!isLoading && !error ? <AdminUsersTable adminUsers={filteredAdminUsers} onToggleActive={(adminUser) => void handleToggleActive(adminUser)} /> : null}
          {isSubmitting && !isLoading ? <p className="mt-4 text-sm text-slate-500">Updating admin user status...</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
