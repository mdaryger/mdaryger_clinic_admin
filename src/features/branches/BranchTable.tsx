import { Eye, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import type { ClinicBranch } from '../../services/branchService';

type BranchTableProps = {
  branches: ClinicBranch[];
  onToggleActive: (branch: ClinicBranch) => void;
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

export function BranchTable({ branches, onToggleActive }: BranchTableProps) {
  const columns: DataTableColumn<ClinicBranch>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (branch) => (
        <div>
          <p className="font-semibold text-slate-950">{branch.name}</p>
          <p className="text-xs text-slate-500">{branch.id}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      cell: (branch) => branch.city || '-',
    },
    {
      key: 'address',
      header: 'Address',
      cell: (branch) => branch.address || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (branch) => branch.phone || '-',
    },
    {
      key: 'active',
      header: 'Active',
      cell: (branch) => <Badge tone={branch.isActive ? 'green' : 'slate'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'main',
      header: 'Main branch',
      cell: (branch) => <Badge tone={branch.isMainBranch ? 'primary' : 'slate'}>{branch.isMainBranch ? 'Main' : 'No'}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (branch) => formatDate(branch.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (branch) => (
        <div className="flex justify-end gap-2">
          <Link to={`/clinic-branches/${branch.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Open branch details">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => onToggleActive(branch)}
            aria-label={branch.isActive ? 'Disable branch' : 'Enable branch'}
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
      data={branches}
      getRowKey={(branch) => branch.id}
      emptyTitle="No branches found"
      emptyDescription="Create a branch or adjust the current filters."
    />
  );
}
