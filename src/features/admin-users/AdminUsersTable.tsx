import { Eye, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
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
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'fullName',
      header: 'Full name',
      cell: (adminUser) => (
        <div>
          <p className="font-semibold text-slate-950">{adminUser.displayName || `${adminUser.firstName} ${adminUser.lastName}`.trim()}</p>
          <p className="text-xs text-slate-500">{adminUser.id}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (adminUser) => adminUser.email || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (adminUser) => adminUser.phone || '-',
    },
    {
      key: 'role',
      header: 'Role',
      cell: (adminUser) => formatRole(adminUser.normalizedRole),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (adminUser) => <Badge tone={adminUser.isActive ? 'green' : 'slate'}>{adminUser.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'emailVerified',
      header: 'Email verified',
      cell: (adminUser) => <Badge tone={adminUser.isEmailVerified ? 'primary' : 'slate'}>{adminUser.isEmailVerified ? 'Verified' : 'Unverified'}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (adminUser) => formatDate(adminUser.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (adminUser) => (
        <div className="flex justify-end gap-2">
          <Link to={`/admin-users/${adminUser.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Open admin user details">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={adminUser.isActive ? 'Deactivate admin user' : 'Activate admin user'}
            onClick={() => onToggleActive(adminUser)}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
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
      emptyTitle="No admin users found"
      emptyDescription="Create an admin user or adjust the current search and filters."
    />
  );
}
