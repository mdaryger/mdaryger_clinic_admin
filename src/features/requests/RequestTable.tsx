import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { StatusChip } from '../../components/ui/StatusChip';
import { UrgencyChip } from '../../components/ui/UrgencyChip';
import { useI18n } from '../../i18n/useI18n';
import type { RequestRecord } from '../../services/requestService';

type RequestTableProps = {
  requests: RequestRecord[];
  detailsBasePath: string;
  sourceQuery?: string;
};

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

export function RequestTable({ requests, detailsBasePath, sourceQuery }: RequestTableProps) {
  const { t } = useI18n();
  const detailsSuffix = sourceQuery ? `?source=${sourceQuery}` : '';
  const columns: DataTableColumn<RequestRecord>[] = [
    {
      key: 'patient',
      header: t('requests.patient'),
      cell: (request) => (
        <div>
          <p className="font-semibold text-slate-950">{request.patientName || '-'}</p>
          <p className="text-xs text-slate-500">{request.id}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('requests.phone'),
      cell: (request) => request.patientPhone || '-',
    },
    {
      key: 'status',
      header: t('requests.statusLabel'),
      cell: (request) => <StatusChip status={request.status} />,
    },
    {
      key: 'urgency',
      header: t('requests.urgencyLabel'),
      cell: (request) => <UrgencyChip urgency={request.urgency} />,
    },
    {
      key: 'doctor',
      header: t('requests.doctor'),
      cell: (request) => request.doctorName || request.selectedDoctorId || request.doctorId || '-',
    },
    {
      key: 'cost',
      header: t('requests.cost'),
      cell: (request) => request.cost ?? request.finalPrice ?? request.estimatedPrice ?? '-',
    },
    {
      key: 'createdAt',
      header: t('requests.created'),
      cell: (request) => formatDate(request.createdAt),
    },
    {
      key: 'actions',
      header: t('requests.actions'),
      className: 'text-right',
      cell: (request) => (
        <div className="flex justify-end gap-2">
          <Link to={`${detailsBasePath}/${request.id}${detailsSuffix}`}>
            <Button type="button" variant="secondary" size="icon" aria-label={t('requests.openRequest')}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      getRowKey={(request) => request.id}
      emptyTitle={t('requests.emptyTitle')}
      emptyDescription={t('requests.emptyDescription')}
    />
  );
}
