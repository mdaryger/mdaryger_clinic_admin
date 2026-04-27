import { Edit, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import type { Clinic } from '../../types/clinic';

type ClinicTableProps = {
  clinics: Clinic[];
  onEdit: (clinic: Clinic) => void;
  onDelete: (clinic: Clinic) => void;
};

export function ClinicTable({ clinics, onEdit, onDelete }: ClinicTableProps) {
  const columns: DataTableColumn<Clinic>[] = [
    {
      key: 'name',
      header: 'Clinic',
      cell: (clinic) => (
        <div>
          <p className="font-semibold text-slate-950">{clinic.name}</p>
          <p className="text-xs text-slate-500">{clinic.id}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      cell: (clinic) => clinic.city || '-',
    },
    {
      key: 'contacts',
      header: 'Contacts',
      cell: (clinic) => (
        <div className="space-y-1">
          <p>{clinic.phone || '-'}</p>
          <p className="text-xs text-slate-500">{clinic.email || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (clinic) => (
        <div className="flex flex-wrap gap-2">
          <Badge tone={clinic.isActive ? 'green' : 'slate'}>{clinic.isActive ? 'Active' : 'Inactive'}</Badge>
          <Badge tone={clinic.isVerified ? 'primary' : 'yellow'}>{clinic.isVerified ? 'Verified' : 'Unverified'}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (clinic) => (
        <div className="flex justify-end gap-2">
          <Link to={`/super-admin/clinic/${clinic.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Open clinic details">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button type="button" variant="secondary" size="icon" onClick={() => onEdit(clinic)} aria-label="Edit clinic">
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="danger" size="icon" onClick={() => onDelete(clinic)} aria-label="Delete clinic">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clinics}
      getRowKey={(clinic) => clinic.id}
      emptyTitle="No clinics found"
      emptyDescription="Create the first clinic or adjust your search query."
    />
  );
}
