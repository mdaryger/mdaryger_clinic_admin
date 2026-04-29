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
import { useI18n } from '../../i18n/useI18n';
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
  const { t } = useI18n();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const showToast = useToastStore((state) => state.showToast);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClinic = useCallback(async () => {
    if (!clinicId) {
      setError(t('superAdmin.clinicNotFoundDescription'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setClinic(await getClinicById(clinicId));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('superAdmin.loadClinicFailed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, t]);

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
      showToast({ type: 'success', title: t('superAdmin.clinicUpdated') });
      setIsEditing(false);
      await loadClinic();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('superAdmin.updateFailed');
      showToast({ type: 'error', title: t('superAdmin.updateFailed'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState label={t('superAdmin.loadingClinic')} />;
  }

  if (error) {
    return <ErrorState title={t('superAdmin.loadClinicFailed')} description={error} actionLabel={t('common.retry')} onAction={() => void loadClinic()} />;
  }

  if (!clinic) {
    return <ErrorState title={t('superAdmin.clinicNotFound')} description={t('superAdmin.clinicNotFoundDescription')} />;
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
                {t('superAdmin.back')}
              </Button>
            </Link>
            <Button type="button" onClick={() => setIsEditing((value) => !value)}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              {t('superAdmin.edit')}
            </Button>
          </>
        }
      />

      {isEditing ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">{t('superAdmin.editClinicTitle')}</h2>
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
              <Badge tone={clinic.isActive ? 'green' : 'slate'}>{clinic.isActive ? t('superAdmin.active') : t('superAdmin.inactive')}</Badge>
              <Badge tone={clinic.isVerified ? 'primary' : 'yellow'}>{clinic.isVerified ? t('superAdmin.verified') : t('superAdmin.unverified')}</Badge>
              {clinic.isProcedureRoom ? <Badge tone="blue">{t('superAdmin.procedureRoom')}</Badge> : null}
              {clinic.isTraumaCenter ? <Badge tone="red">{t('superAdmin.traumaCenter')}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                [t('superAdmin.address'), clinic.address],
                [t('superAdmin.phone'), clinic.phone],
                [t('superAdmin.email'), clinic.email],
                [t('superAdmin.website'), clinic.website],
                [t('superAdmin.workingHours'), clinic.workingHours],
                [t('superAdmin.procedureRoomPrice'), clinic.procedureRoomPrice ?? '-'],
                [t('superAdmin.contactName'), clinic.contactPersonName],
                [t('superAdmin.contactPhone'), clinic.contactPersonPhone],
                [t('superAdmin.contactEmail'), clinic.contactPersonEmail],
                [t('superAdmin.latitude'), clinic.location.latitude ?? '-'],
                [t('superAdmin.longitude'), clinic.location.longitude ?? '-'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm text-slate-900">{String(value || '-')}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-slate-500">{t('superAdmin.description')}</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-900">{clinic.description || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
