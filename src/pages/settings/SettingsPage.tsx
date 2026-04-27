import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ClinicSettingsForm } from '../../features/settings/ClinicSettingsForm';
import { updateClinic } from '../../services/clinicService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Clinic } from '../../types/clinic';

function booleanTone(value: boolean): 'green' | 'slate' {
  return value ? 'green' : 'slate';
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || 'Not specified'}</p>
    </div>
  );
}

function asClinicRecord(clinic: Record<string, unknown> | null): Clinic | null {
  if (!clinic) {
    return null;
  }

  return clinic as Clinic;
}

export function SettingsPage() {
  const { clinic, clinicId, isClinicAdmin, refreshProfile } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clinicRecord = useMemo(() => asClinicRecord(clinic), [clinic]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId || !clinicRecord) {
    return <Navigate to="/clinic-overview" replace />;
  }

  const handleSave = async (data: Partial<Clinic>) => {
    setIsSubmitting(true);

    try {
      await updateClinic(clinicId, data);
      await refreshProfile();
      setIsEditing(false);
      showToast({ type: 'success', title: 'Settings saved' });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to save clinic settings.';
      showToast({ type: 'error', title: 'Save failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="View and update the current clinic profile used across the admin workspace."
        actions={
          !isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit settings
            </Button>
          ) : null
        }
      />

      {isEditing ? (
        <ClinicSettingsForm
          clinic={clinicRecord}
          isSubmitting={isSubmitting}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge tone={booleanTone(clinicRecord.isActive)}>{clinicRecord.isActive ? 'Active' : 'Inactive'}</Badge>
                <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
                  {clinicRecord.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Name" value={clinicRecord.name} />
              <DetailItem label="Phone" value={clinicRecord.phone} />
              <DetailItem label="Address" value={clinicRecord.address} />
              <DetailItem label="Working hours" value={clinicRecord.workingHours} />
              <DetailItem label="Email" value={clinicRecord.email} />
              <DetailItem label="Website" value={clinicRecord.website} />
              <div className="sm:col-span-2">
                <DetailItem label="Description" value={clinicRecord.description} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">Contact person</h2>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailItem label="Name" value={clinicRecord.contactPersonName} />
                <DetailItem label="Phone" value={clinicRecord.contactPersonPhone} />
                <DetailItem label="Email" value={clinicRecord.contactPersonEmail} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">Capabilities</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem
                  label="Procedure room"
                  value={clinicRecord.isProcedureRoom ? `Enabled${clinicRecord.procedureRoomPrice !== null ? ` • ${clinicRecord.procedureRoomPrice}` : ''}` : 'Disabled'}
                />
                <DetailItem
                  label="Trauma center"
                  value={clinicRecord.isTraumaCenter ? 'Enabled' : 'Disabled'}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
