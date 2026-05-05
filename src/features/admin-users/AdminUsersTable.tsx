import { Eye, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { useI18n } from '../../i18n/useI18n';
import type { AdminUser } from '../../services/adminUserService';

type AdminUsersTableProps = {
  adminUsers: AdminUser[];
  onToggleActive: (adminUser: AdminUser) => void;
};

function formatDate(value: unknown): string {
  if (!value) {
    return '-';
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === 'function') {
      return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestampLike.toDate());
    }

    if (typeof timestampLike.seconds === 'number') {
      return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(timestampLike.seconds * 1000));
    }
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatRole(role: AdminUser['normalizedRole']): string {
  return role === 'clinic_branch_admin' ? 'Clinic branch admin' : 'Clinic admin';
}

export function AdminUsersTable({ adminUsers, onToggleActive }: AdminUsersTableProps) {
  const { t } = useI18n();
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'fullName',
      header: t('adminUsers.fullName'),
      cell: (adminUser) => (
        <div>
          <p className="font-semibold text-slate-950">{adminUser.displayName || `${adminUser.firstName} ${adminUser.lastName}`.trim()}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('adminUsers.email'),
      cell: (adminUser) => adminUser.email || '-',
    },
    {
      key: 'phone',
      header: t('adminUsers.phone'),
      cell: (adminUser) => adminUser.phone || '-',
    },
    {
      key: 'role',
      header: t('adminUsers.role'),
      cell: (adminUser) =>
        adminUser.normalizedRole === 'clinic_branch_admin'
          ? t('adminUsers.branchAdmin')
          : t('adminUsers.clinicAdmin'),
    },
    {
      key: 'active',
      header: t('adminUsers.active'),
      cell: (adminUser) => <Badge tone={adminUser.isActive ? 'green' : 'slate'}>{adminUser.isActive ? t('doctors.active') : t('doctors.inactive')}</Badge>,
    },
    {
      key: 'emailVerified',
      header: t('adminUsers.emailVerified'),
      cell: (adminUser) => <Badge tone={adminUser.isEmailVerified ? 'primary' : 'slate'}>{adminUser.isEmailVerified ? t('doctors.verified') : t('doctors.unverified')}</Badge>,
    },
    {
      key: 'createdAt',
      header: t('adminUsers.created'),
      cell: (adminUser) => formatDate(adminUser.createdAt),
    },
    {
      key: 'actions',
      header: t('adminUsers.actions'),
      className: 'text-right',
      cell: (adminUser) => (
        <div className="flex justify-end gap-2">
          <Link to={`/admin-users/${adminUser.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label={t('adminUsers.openAdmin')}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={adminUser.isActive ? t('adminUsers.deactivateAdmin') : t('adminUsers.activateAdmin')}
            onClick={() => onToggleActive(adminUser)}
          >
            <Power className="h-4 w-4 text-red-500" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={adminUsers}
      getRowKey={(adminUser) => adminUser.id}
      emptyTitle={t('adminUsers.emptyTitle')}
      emptyDescription={t('adminUsers.emptyDescription')}
    />
  );
}
