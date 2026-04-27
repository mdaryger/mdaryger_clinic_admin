import { ArrowLeft, Edit } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ClinicCard } from '../../features/clinics/ClinicCard';
import { ClinicForm } from '../../features/clinics/ClinicForm';
import { getClinicById, updateClinic } from '../../services/clinicService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Clinic, ClinicFormData } from '../../types/clinic';

type FormPayload = {
  data: ClinicFormData;
  logoFile?: File;
  coverFile?: File;
};

export function SuperAdminClinicDetailsPage() {
  const { clinicId } = useParams();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const showToast = useToastStore((state) => state.showToast);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClinic = useCallback(async () => {
    if (!clinicId) {
      setError('Clinic id is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setClinic(await getClinicById(clinicId));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load clinic.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    void loadClinic();
  }, [loadClinic]);

  if (!isSuperAdmin) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async ({ data, logoFile, coverFile }: FormPayload) => {
    if (!clinic) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateClinic(clinic.id, data, logoFile, coverFile);
      showToast({ type: 'success', title: 'Clinic updated' });
      setIsEditing(false);
      await loadClinic();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to update clinic.';
      showToast({ type: 'error', title: 'Update failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading clinic..." />;
  }

  if (error) {
    return <ErrorState title="Unable to load clinic" description={error} actionLabel="Retry" onAction={() => void loadClinic()} />;
  }

  if (!clinic) {
    return <ErrorState title="Clinic not found" description="The requested clinic does not exist." />;
  }

  return (
    <>
      <PageHeader
        title={clinic.name}
        description={`${clinic.city}, ${clinic.country}`}
        actions={
          <>
            <Link to="/super-admin">
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </Link>
            <Button type="button" onClick={() => setIsEditing((value) => !value)}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          </>
        }
      />

      {isEditing ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">Edit clinic</h2>
          </CardHeader>
          <CardContent>
            <ClinicForm clinic={clinic} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => setIsEditing(false)} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ClinicCard clinic={clinic} onEdit={() => setIsEditing(true)} />
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge tone={clinic.isActive ? 'green' : 'slate'}>{clinic.isActive ? 'Active' : 'Inactive'}</Badge>
              <Badge tone={clinic.isVerified ? 'primary' : 'yellow'}>{clinic.isVerified ? 'Verified' : 'Unverified'}</Badge>
              {clinic.isProcedureRoom ? <Badge tone="blue">Procedure room</Badge> : null}
              {clinic.isTraumaCenter ? <Badge tone="red">Trauma center</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Address', clinic.address],
                ['Phone', clinic.phone],
                ['Email', clinic.email],
                ['Website', clinic.website],
                ['Working hours', clinic.workingHours],
                ['Procedure room price', clinic.procedureRoomPrice ?? '-'],
                ['Contact person', clinic.contactPersonName],
                ['Contact phone', clinic.contactPersonPhone],
                ['Contact email', clinic.contactPersonEmail],
                ['Latitude', clinic.location.latitude ?? '-'],
                ['Longitude', clinic.location.longitude ?? '-'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm text-slate-900">{String(value || '-')}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-slate-500">Description</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-900">{clinic.description || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
