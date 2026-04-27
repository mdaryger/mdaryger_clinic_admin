import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import type { Clinic } from '../../types/clinic';

type ClinicCardProps = {
  clinic: Clinic;
  onEdit?: (clinic: Clinic) => void;
  onDelete?: (clinic: Clinic) => void;
};

export function ClinicCard({ clinic, onEdit, onDelete }: ClinicCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-slate-100">
        {clinic.coverImageUrl ? (
          <img className="h-full w-full object-cover" src={clinic.coverImageUrl} alt={`${clinic.name} cover`} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Building2 className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary">
            {clinic.logoUrl ? (
              <img className="h-full w-full object-cover" src={clinic.logoUrl} alt={`${clinic.name} logo`} />
            ) : (
              <Building2 className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-950">{clinic.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{clinic.city || clinic.address}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={clinic.isActive ? 'green' : 'slate'}>{clinic.isActive ? 'Active' : 'Inactive'}</Badge>
          <Badge tone={clinic.isVerified ? 'primary' : 'yellow'}>{clinic.isVerified ? 'Verified' : 'Unverified'}</Badge>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {clinic.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {clinic.phone}
            </p>
          ) : null}
          {clinic.email ? (
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {clinic.email}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/super-admin/clinic/${clinic.id}`}>
            <Button type="button" variant="secondary" size="sm">
              Details
            </Button>
          </Link>
          {onEdit ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(clinic)}>
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button type="button" variant="danger" size="sm" onClick={() => onDelete(clinic)}>
              Delete
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
