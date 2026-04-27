import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { StatusChip } from '../../components/ui/StatusChip';
import { UrgencyChip } from '../../components/ui/UrgencyChip';
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
  const detailsSuffix = sourceQuery ? `?source=${sourceQuery}` : '';
  const columns: DataTableColumn<RequestRecord>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (request) => (
        <div>
          <p className="font-semibold text-slate-950">{request.patientName || '-'}</p>
          <p className="text-xs text-slate-500">{request.id}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (request) => request.patientPhone || '-',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (request) => <StatusChip status={request.status} />,
    },
    {
      key: 'urgency',
      header: 'Urgency',
      cell: (request) => <UrgencyChip urgency={request.urgency} />,
    },
    {
      key: 'doctor',
      header: 'Doctor',
      cell: (request) => request.doctorName || request.selectedDoctorId || request.doctorId || '-',
    },
    {
      key: 'cost',
      header: 'Cost',
      cell: (request) => request.cost ?? request.finalPrice ?? request.estimatedPrice ?? '-',
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (request) => formatDate(request.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (request) => (
        <div className="flex justify-end gap-2">
          <Link to={`${detailsBasePath}/${request.id}${detailsSuffix}`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Open request details">
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
      emptyTitle="No requests found"
      emptyDescription="Requests will appear here when they match the current source and filters."
    />
  );
}
