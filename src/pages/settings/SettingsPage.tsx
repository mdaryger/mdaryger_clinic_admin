import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ClinicSettingsForm } from '../../features/settings/ClinicSettingsForm';
import { useI18n } from '../../i18n/useI18n';
import { updateClinic } from '../../services/clinicService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Clinic } from '../../types/clinic';

function booleanTone(value: boolean): 'green' | 'slate' {
  return value ? 'green' : 'slate';
}

function DetailItem({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || t('settings.notSpecified')}</p>
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
  const { t } = useI18n();
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
      showToast({ type: 'success', title: t('settings.saved') });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('settings.saveFailed');
      showToast({ type: 'error', title: t('settings.saveFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.pageTitle')}
        description={t('settings.pageDescription')}
        actions={
          !isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t('settings.edit')}
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
                <Badge tone={booleanTone(clinicRecord.isActive)}>{clinicRecord.isActive ? t('doctors.active') : t('doctors.inactive')}</Badge>
                <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
                  {clinicRecord.isVerified ? t('doctors.verified') : t('doctors.unverified')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem label={t('settings.name')} value={clinicRecord.name} />
              <DetailItem label={t('settings.phone')} value={clinicRecord.phone} />
              <DetailItem label={t('settings.address')} value={clinicRecord.address} />
              <DetailItem label={t('settings.workingHours')} value={clinicRecord.workingHours} />
              <DetailItem label={t('settings.email')} value={clinicRecord.email} />
              <DetailItem label={t('settings.website')} value={clinicRecord.website} />
              <div className="sm:col-span-2">
                <DetailItem label={t('settings.description')} value={clinicRecord.description} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('settings.contactPerson')}</h2>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailItem label={t('settings.name')} value={clinicRecord.contactPersonName} />
                <DetailItem label={t('settings.phone')} value={clinicRecord.contactPersonPhone} />
                <DetailItem label={t('settings.email')} value={clinicRecord.contactPersonEmail} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('settings.capabilities')}</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem
                  label={t('settings.procedureRoom')}
                  value={clinicRecord.isProcedureRoom ? `${t('settings.enabled')}${clinicRecord.procedureRoomPrice !== null ? ` • ${clinicRecord.procedureRoomPrice}` : ''}` : t('settings.disabled')}
                />
                <DetailItem
                  label={t('settings.traumaCenter')}
                  value={clinicRecord.isTraumaCenter ? t('settings.enabled') : t('settings.disabled')}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
