import { Eye, Pencil, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { useI18n } from '../../i18n/useI18n';
import type { ClinicBranch } from '../../services/branchService';

export type BranchListItem = ClinicBranch & {
  isPrimaryClinic?: boolean;
};

type BranchTableProps = {
  branches: BranchListItem[];
  onToggleActive: (branch: BranchListItem) => void;
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
  const { t } = useI18n();

  const columns: DataTableColumn<BranchListItem>[] = [
    {
      key: 'name',
      header: t('branches.name'),
      cell: (branch) => (
        <div>
          <p className="font-semibold text-slate-950">{branch.name}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: t('branches.city'),
      cell: (branch) => branch.city || '-',
    },
    {
      key: 'address',
      header: t('branches.address'),
      cell: (branch) => branch.address || '-',
    },
    {
      key: 'phone',
      header: t('branches.phone'),
      cell: (branch) => branch.phone || '-',
    },
    {
      key: 'workingHours',
      header: t('branches.workingHours'),
      cell: (branch) =>
        branch.isAroundTheClock
          ? <Badge tone="green">{t('branches.aroundTheClock')}</Badge>
          : <span className="text-sm text-slate-700">{branch.openingHours && branch.closingHours ? `${branch.openingHours} – ${branch.closingHours}` : '-'}</span>,
    },
    {
      key: 'active',
      header: t('branches.active'),
      cell: (branch) => <Badge tone={branch.isActive ? 'green' : 'slate'}>{branch.isActive ? t('branches.activeBadge') : t('branches.inactiveBadge')}</Badge>,
    },
    {
      key: 'main',
      header: t('branches.mainBranch'),
      cell: (branch) => <Badge tone={branch.isMainBranch ? 'primary' : 'slate'}>{branch.isMainBranch ? t('branches.mainBadge') : t('branches.notMainBadge')}</Badge>,
    },
    {
      key: 'createdAt',
      header: t('branches.created'),
      cell: (branch) => formatDate(branch.createdAt),
    },
    {
      key: 'actions',
      header: t('branches.actions'),
      className: 'text-right',
      cell: (branch) => (
        <div className="flex justify-end gap-2">
          {branch.isPrimaryClinic ? null : (
            <>
              <Link to={`/clinic-branches/${branch.id}`}>
                <Button type="button" variant="secondary" size="icon" aria-label={t('branches.openBranch')}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to={`/clinic-branches/${branch.id}/edit`}>
                <Button type="button" variant="secondary" size="icon" aria-label={t('branches.edit')}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className={branch.isActive ? 'text-red-600 hover:border-red-200 hover:text-red-700' : 'text-emerald-600 hover:border-emerald-200 hover:text-emerald-700'}
                onClick={() => onToggleActive(branch)}
                aria-label={branch.isActive ? t('branches.disableBranch') : t('branches.enableBranch')}
              >
                <Power className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={branches}
      getRowKey={(branch) => branch.id}
      emptyTitle={t('branches.emptyTitle')}
      emptyDescription={t('branches.emptyDescription')}
    />
  );
}
